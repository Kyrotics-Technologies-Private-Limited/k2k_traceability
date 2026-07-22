/**
 * Delete top-level flat traceability Firestore collections.
 *
 * These were created by the May 2026 traceability platform (commit 501bc95).
 * The app now uses only the nested model:
 *   productCategory/{id}/batches/{id}/packets/{id}
 * plus serialNumbers, users, products.
 *
 * SAFETY: Only deletes known flat traceability root collections.
 * Nested batches/packets under productCategory are never touched.
 *
 * Usage:
 *   node scratch/delete_flat_traceability_collections.js
 *     → dry-run (default): counts documents, deletes nothing
 *
 *   node scratch/delete_flat_traceability_collections.js --execute --yes
 *     → delete all documents in flat collections
 *
 *   node scratch/delete_flat_traceability_collections.js --execute --yes --since=2026-07-16
 *     → delete only docs with createdAt/updatedAt on or after that date (UTC midnight)
 *
 *   node scratch/delete_flat_traceability_collections.js --execute --yes --collection=packets
 *     → delete one collection only
 *
 * Requires .env with FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

const path = require("path");
const fs = require("fs");

const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
} else {
  console.error("Error: .env file not found at:", envPath);
  process.exit(1);
}

const admin = require("firebase-admin");

if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.error(
    "Error: Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in .env"
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

/** From src/lib/traceability/collections.ts (removed module) */
const FLAT_TRACEABILITY_COLLECTIONS = [
  "traceabilityRoots",
  "batches",
  "packets",
  "traceabilityEvents",
  "qrAliases",
  "recalls",
  "reconciliationJobs",
  "productionRuns",
];

/** Never delete these — nested model + auth + serial index */
const PROTECTED_COLLECTIONS = new Set([
  "productCategory",
  "serialNumbers",
  "users",
  "products",
]);

const BATCH_SIZE = 400;

function parseArgs(argv) {
  const args = {
    execute: false,
    yes: false,
    since: null,
    collection: null,
  };

  for (const arg of argv) {
    if (arg === "--execute") args.execute = true;
    else if (arg === "--yes") args.yes = true;
    else if (arg.startsWith("--since=")) args.since = arg.slice("--since=".length);
    else if (arg.startsWith("--collection=")) args.collection = arg.slice("--collection=".length);
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Delete flat traceability Firestore collections (dry-run by default).

Options:
  --execute           Actually delete documents (default is dry-run)
  --yes               Required with --execute (confirms destructive action)
  --since=YYYY-MM-DD  Only delete docs created/updated on or after this UTC date
  --collection=NAME   Target a single flat collection (e.g. packets)
  --help, -h          Show this help

Collections removed:
  ${FLAT_TRACEABILITY_COLLECTIONS.join(", ")}

Protected (never touched):
  ${[...PROTECTED_COLLECTIONS].join(", ")}
`);
}

function parseSinceDate(since) {
  if (!since) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(since);
  if (!match) {
    console.error(`Invalid --since value "${since}". Use YYYY-MM-DD.`);
    process.exit(1);
  }
  const [, y, m, d] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0));
}

function toMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function docMatchesSince(data, sinceMs) {
  if (!sinceMs) return true;
  const created = toMillis(data.createdAt);
  const updated = toMillis(data.updatedAt);
  if (created != null && created >= sinceMs) return true;
  if (updated != null && updated >= sinceMs) return true;
  return false;
}

async function countCollection(collectionName, sinceMs) {
  let total = 0;
  let matched = 0;
  let lastDoc = null;

  while (true) {
    let query = db
      .collection(collectionName)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(BATCH_SIZE);

    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      total++;
      if (docMatchesSince(doc.data(), sinceMs)) matched++;
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < BATCH_SIZE) break;
  }

  return { total, matched };
}

async function deleteCollection(collectionName, sinceMs, dryRun) {
  let deleted = 0;
  let skipped = 0;
  let lastDoc = null;

  while (true) {
    let query = db
      .collection(collectionName)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(BATCH_SIZE);

    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    const toDelete = [];
    for (const doc of snapshot.docs) {
      if (docMatchesSince(doc.data(), sinceMs)) {
        toDelete.push(doc.ref);
      } else {
        skipped++;
      }
    }

    if (!dryRun && toDelete.length > 0) {
      const batch = db.batch();
      for (const ref of toDelete) batch.delete(ref);
      await batch.commit();
    }

    deleted += toDelete.length;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < BATCH_SIZE) break;
  }

  return { deleted, skipped };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sinceMs = parseSinceDate(args.since);
  const mode = args.execute ? "EXECUTE" : "DRY-RUN";

  const targets = args.collection
    ? [args.collection]
    : [...FLAT_TRACEABILITY_COLLECTIONS];

  for (const name of targets) {
    if (PROTECTED_COLLECTIONS.has(name)) {
      console.error(`Refusing to touch protected collection: ${name}`);
      process.exit(1);
    }
    if (!FLAT_TRACEABILITY_COLLECTIONS.includes(name)) {
      console.error(
        `Unknown collection "${name}". Allowed: ${FLAT_TRACEABILITY_COLLECTIONS.join(", ")}`
      );
      process.exit(1);
    }
  }

  console.log("=".repeat(60));
  console.log("Flat traceability collection cleanup");
  console.log("Project:", process.env.FIREBASE_PROJECT_ID);
  console.log("Mode:", mode);
  if (sinceMs) {
    console.log("Since filter (UTC):", new Date(sinceMs).toISOString().slice(0, 10));
    console.log("Note: docs without createdAt/updatedAt are skipped when --since is set.");
  }
  console.log("Targets:", targets.join(", "));
  console.log("=".repeat(60));

  if (args.execute && !args.yes) {
    console.error("\nRefusing to delete without --yes. Example:");
    console.error(
      "  node scratch/delete_flat_traceability_collections.js --execute --yes"
    );
    process.exit(1);
  }

  const summary = [];

  for (const collectionName of targets) {
    console.log(`\nScanning /${collectionName} ...`);
    const { total, matched } = await countCollection(collectionName, sinceMs);

    if (sinceMs) {
      console.log(`  Total docs: ${total}`);
      console.log(`  Matching --since filter: ${matched}`);
    } else {
      console.log(`  Documents: ${total}`);
    }

    if (matched === 0) {
      summary.push({ collectionName, deleted: 0, skipped: total });
      console.log("  Nothing to delete.");
      continue;
    }

    if (!args.execute) {
      summary.push({ collectionName, deleted: matched, skipped: sinceMs ? total - matched : 0 });
      console.log(`  [DRY-RUN] Would delete ${matched} document(s).`);
      continue;
    }

    console.log(`  Deleting ${matched} document(s)...`);
    const { deleted, skipped } = await deleteCollection(collectionName, sinceMs, false);
    summary.push({ collectionName, deleted, skipped });
    console.log(`  Deleted: ${deleted}, skipped (date filter): ${skipped}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  let totalDeleted = 0;
  for (const row of summary) {
    const label = args.execute ? "deleted" : "would delete";
    console.log(`  ${row.collectionName}: ${row.deleted} ${label}`);
    totalDeleted += row.deleted;
  }
  console.log(`  Total: ${totalDeleted}`);

  if (!args.execute && totalDeleted > 0) {
    console.log("\nDry-run complete. To delete, run:");
    console.log(
      "  node scratch/delete_flat_traceability_collections.js --execute --yes"
    );
  } else if (args.execute) {
    console.log("\nDone. Nested productCategory data was not modified.");
  }
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
