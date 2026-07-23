/**
 * Diagnose + fix UniVillage frontend phone-auth / reCAPTCHA failures.
 *
 * Typical symptoms on Cloud Run:
 *   - UI: "reCAPTCHA failed. Please refresh and try again."
 *   - Network: Google HTML 400 "Unknown SID" on channel?gsessionid=...
 *
 * Root causes after Firebase project migration (most common):
 *   1. Cloud Run host missing from Firebase Auth Authorized Domains
 *   2. SMS region policy blocking India (+91) on new projects
 *   3. Phone provider disabled
 *   4. Frontend still using an old Firebase apiKey (build-time env)
 *
 * Usage:
 *   node scratch/fix-univillage-phone-auth.js
 *   node scratch/fix-univillage-phone-auth.js --check-only
 *   node scratch/fix-univillage-phone-auth.js --domain univillage-frontend-1076110367693.us-central1.run.app
 *
 * Requires ADC against univillage-503009:
 *   gcloud config set project univillage-503009
 *   gcloud auth application-default login
 */
const path = require("path");
const fs = require("fs");
const { GoogleAuth } = require("google-auth-library");

const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

const projectId = process.env.FIREBASE_PROJECT_ID || "univillage-503009";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const args = process.argv.slice(2);
const checkOnly = args.includes("--check-only");
const domainIdx = args.indexOf("--domain");
const cloudRunDomain =
  (domainIdx >= 0 && args[domainIdx + 1]) ||
  "univillage-frontend-1076110367693.us-central1.run.app";

const CONFIG_URL = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;

async function getAuthClient() {
  const auth = new GoogleAuth({
    scopes: [
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/identitytoolkit",
      "https://www.googleapis.com/auth/firebase",
    ],
    projectId,
  });
  const client = await auth.getClient();
  // User ADC requires an explicit quota project for Identity Toolkit Admin APIs.
  if (typeof client.setQuotaProjectId === "function") {
    client.setQuotaProjectId(projectId);
  } else {
    client.quotaProjectId = projectId;
  }
  return client;
}

async function authFetch(client, url, options = {}) {
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) {
    throw new Error("Failed to obtain access token from ADC");
  }
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${tokenResponse.token}`,
    "x-goog-user-project": projectId,
  };
  return fetch(url, { ...options, headers });
}

async function getConfig(client) {
  const res = await authFetch(client, CONFIG_URL);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GET config failed (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

async function patchConfig(client, body, updateMask) {
  const url = `${CONFIG_URL}?updateMask=${encodeURIComponent(updateMask)}`;
  const res = await authFetch(client, url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`PATCH config failed (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

async function checkRecaptchaParams() {
  if (!apiKey) {
    console.log("\n[recaptchaParams] SKIP — NEXT_PUBLIC_FIREBASE_API_KEY missing in .env");
    return;
  }
  const url = `https://identitytoolkit.googleapis.com/v1/recaptchaParams?key=${apiKey}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log(`\n[recaptchaParams] HTTP ${res.status}`);
  if (!res.ok) {
    console.log(text.slice(0, 500));
    console.log(
      "→ API key may be wrong/restricted, or Identity Toolkit API disabled for this key/project."
    );
    return;
  }
  const data = JSON.parse(text);
  console.log("→ recaptchaSiteKey present:", Boolean(data.recaptchaSiteKey));
}

function summarizeProviders(config) {
  const providers = config.signIn?.email?.enabled != null
    ? {
        email: config.signIn?.email?.enabled,
        phone: config.signIn?.phoneNumber?.enabled,
      }
    : null;

  // Older / alternate shape
  const methods = config.signIn?.allowDuplicateEmails;
  return { providers, allowDuplicateEmails: methods, rawSignInKeys: Object.keys(config.signIn || {}) };
}

async function main() {
  console.log(`Project: ${projectId}`);
  console.log(`Target Cloud Run domain: ${cloudRunDomain}`);
  console.log(`Mode: ${checkOnly ? "check-only" : "fix (add domain + allow IN SMS region)"}`);

  await checkRecaptchaParams();

  const client = await getAuthClient();
  let config = await getConfig(client);

  const domains = config.authorizedDomains || [];
  console.log("\n[authorizedDomains]");
  console.log(domains.length ? domains.map((d) => `  - ${d}`).join("\n") : "  (none)");

  const hasDomain = domains.includes(cloudRunDomain);
  console.log(
    hasDomain
      ? `\n✓ Cloud Run domain already authorized: ${cloudRunDomain}`
      : `\n✗ Cloud Run domain NOT authorized: ${cloudRunDomain}`
  );

  const smsPolicy = config.smsRegionConfig || {};
  console.log("\n[smsRegionConfig]");
  console.log(JSON.stringify(smsPolicy, null, 2));

  const allowlist = smsPolicy.allowlistOnly?.allowedRegions || [];
  const denylist = smsPolicy.denylistOnly?.disallowedRegions || [];
  const allowsIndia =
    (smsPolicy.allowlistOnly && allowlist.includes("IN")) ||
    (smsPolicy.denylistOnly && !denylist.includes("IN")) ||
    (!smsPolicy.allowlistOnly && !smsPolicy.denylistOnly);

  // New Firebase projects often default to allowlist with NO regions → SMS blocked everywhere.
  const emptyAllowlist =
    Boolean(smsPolicy.allowlistOnly) && allowlist.length === 0;

  console.log(
    emptyAllowlist
      ? "\n✗ SMS region allowlist is EMPTY — phone OTP to +91 will fail."
      : allowsIndia
        ? "\n✓ India (IN / +91) appears allowed by SMS region policy."
        : "\n✗ India (IN / +91) may be blocked by SMS region policy."
  );

  console.log("\n[signIn summary]");
  console.log(JSON.stringify(summarizeProviders(config), null, 2));
  if (config.signIn?.phoneNumber) {
    console.log("phoneNumber config:", JSON.stringify(config.signIn.phoneNumber, null, 2));
  }

  if (checkOnly) {
    console.log("\nCheck-only complete. Re-run without --check-only to apply fixes.");
    return;
  }

  let changed = false;

  if (!hasDomain) {
    const nextDomains = Array.from(new Set([...domains, cloudRunDomain]));
    console.log(`\nAdding authorized domain: ${cloudRunDomain}`);
    config = await patchConfig(
      client,
      { authorizedDomains: nextDomains },
      "authorizedDomains"
    );
    changed = true;
    console.log("✓ authorizedDomains updated");
  }

  if (emptyAllowlist || (smsPolicy.allowlistOnly && !allowlist.includes("IN"))) {
    console.log("\nUpdating SMS region policy to allowlist IN (India)...");
    // Identity Toolkit uses smsRegionConfig.allowList / allowlistOnly depending on API version.
    // Prefer allowlistOnly with IN for new projects.
    config = await patchConfig(
      client,
      {
        smsRegionConfig: {
          allowlistOnly: {
            allowedRegions: Array.from(
              new Set([...(smsPolicy.allowlistOnly?.allowedRegions || []), "IN"])
            ),
          },
        },
      },
      "smsRegionConfig"
    );
    changed = true;
    console.log("✓ smsRegionConfig updated (IN allowed)");
  }

  if (!config.signIn?.phoneNumber?.enabled) {
    console.log("\nEnabling Phone sign-in provider...");
    try {
      config = await patchConfig(
        client,
        { signIn: { phoneNumber: { enabled: true } } },
        "signIn.phoneNumber.enabled"
      );
      changed = true;
      console.log("✓ Phone provider enabled");
    } catch (err) {
      console.warn("Could not enable phone provider via API:", err.message);
      console.warn("Enable Phone under Firebase Console → Authentication → Sign-in method.");
    }
  }

  if (!changed) {
    console.log("\nNo config changes needed.");
  } else {
    console.log("\nDone. Hard-refresh the UniVillage frontend and retry phone login.");
    console.log(`URL: https://${cloudRunDomain}`);
  }

  console.log("\nIf reCAPTCHA still fails after domain/SMS fixes:");
  console.log("  1. Confirm the deployed JS uses apiKey for univillage-503009 (not old project).");
  console.log("  2. Rebuild/redeploy Cloud Run with the new NEXT_PUBLIC_/VITE_ Firebase env at BUILD time.");
  console.log("  3. Check API key Application restrictions allow this Cloud Run HTTP referrer.");
}

main().catch((err) => {
  console.error("\nFailed:", err.message || err);
  if (String(err.message || "").includes("permission") || String(err.message || "").includes("403")) {
    console.error(
      "\nTip: your ADC account needs Firebase / Identity Toolkit Admin on univillage-503009.\n" +
        "     gcloud auth application-default login\n" +
        "     gcloud config set project univillage-503009"
    );
  }
  process.exit(1);
});
