const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "PROJECT_EVOLUTION_REPORT.md");
let c = fs.readFileSync(file, "utf8");

// Fix UTF-8 mojibake (Latin-1 misread of UTF-8 bytes)
const fixes = [
  ["\u00e2\u201d\u0152", "\u250c"], // â"Œ → ┌
  ["\u00e2\u201d\u201d", "\u2514"], // â"" → └
  ["\u00e2\u201d\u201a", "\u2502"], // â"‚ → │
  ["\u00e2\u201d\u0153", "\u251c"], // â"œ → ├
  ["\u00e2\u201d\u20ac", "\u2500"], // â"€ → ─
  ["\u00e2\u201d\u20ac\u00e2\u201d\u20ac\u00e2\u201d\u20ac\u00e2\u201d\u20ac", "\u2500\u2500\u2500\u2500"], // long horizontal
  ["\u00e2\u201d\u20ac\u00e2\u201d\u20ac", "\u2500\u2500"],
  ["\u00e2\u201d\u20ac", "\u2500"],
  ["\u00e2\u2013\u00ba", "\u25ba"], // â–º → ►
  ["\u00e2\u2014\u20ac", "\u2500"],
  ["\u00e2\u2014\u201c", "\u2014"],
  ["\u00e2\u20ac\u201d", "\u2014"],
  ["\u00e2\u20ac\u201c", "\u2014"],
  ["\u00e2\u20ac\u00a6", "\u2026"],
  ["\u00e2\u2020\u2019", "\u2192"],
  ["\u00e2\u2020\u2018", "\u2190"],
  ["\u00e2\u2014\u201c", "\u2014"],
  ["\u25c4\u00e2\u201d\u20ac", "\u25c4\u2500"], // ◄â"€
  ["\u00e2\u201d\u02dc", "\u2518"], // â"˜ → ┘
  ["\u00e2\u201d\u20ac\u00e2\u201d\u02dc", "\u2500\u2518"],
];
for (const [bad, good] of fixes) {
  c = c.split(bad).join(good);
}

// Business flow diagram — ASCII replacement
c = c.replace(
  /```\n[\s\S]*?Serial\/QR[\s\S]*?```\n\n\*\*Step-by-step/,
  `\`\`\`
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Admin      │────►│  Product     │────►│  Batch      │────►│  Packets     │
│  Login      │     │  Category    │     │  Creation   │     │  Generation  │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                                                                    │
                    ┌───────────────┐     ┌───────────────┐          │
                    │  Consumer     │◄────│  Serial on    │◄─────────┘
                    │  Verification │     │  Label        │
                    └───────────────┘     └───────────────┘
\`\`\`

**Step-by-step`
);

// Remove QR Scan Request block
c = c.replace(
  /### QR Scan Request[\s\S]*?```\n\n---\n\n# SECTION 11/,
  `---\n\n# SECTION 11`
);

// Section 7 — mark traceability changes as historical
c = c.replace(
  "## Change 2: Traceability Platform (May 2026, `501bc95`)",
  "## Change 2: Traceability Platform (May 2026, `501bc95`) — **REMOVED Jul 2026**"
);
c = c.replace(
  "| **Result** | O(1) QR lookup; recall management; integrity scanning; event timeline |",
  "| **Result** | Added flat platform (later removed — see Change 11) |"
);
c = c.replace(
  "## Change 5: Dual-Read Customer Lookup (Uncommitted, Jul 2026)",
  "## Change 5: Dual-Read Customer Lookup — **SUPERSEDED by Change 11**"
);
c = c.replace(
  "## Change 8: Customer Page → API Lookup (Uncommitted)",
  "## Change 8: Customer Page → API Lookup — **UPDATED in Change 11**"
);
c = c.replace(
  "| **Solution** | `GET /api/traceability/resolve-serial?s={serialNo}` |",
  "| **Solution** | `GET /api/customer/resolve-serial?s={serialNo}` (was traceability route) |"
);
c = c.replace(
  "## Change 9: Flat Packet Sync on Legacy Generate (Uncommitted)",
  "## Change 9: Flat Packet Sync — **REMOVED in Change 11**"
);
c = c.replace(
  "| **Result** | New packets exist in both models; QR aliases created |",
  "| **Result** | Dual-write removed; nested-only packet generation |"
);

// Section 8 master table — mark traceability as DELETED
const deletedRows = [
  ["| `src/lib/traceability/*` | — | Flat traceability data layer | May 2026 platform | QR, recalls, events, integrity |",
   "| `src/lib/traceability/*` | Flat traceability data layer | **DELETED Jul 2026** | Simplification | Removed unused platform |"],
  ["| `src/lib/traceability/legacy-resolve.ts` | — | Dual-read public lookup bridge | Migration compatibility | Customer lookup works for both models |",
   "| `src/lib/traceability/legacy-resolve.ts` | Dual-read bridge | **DELETED** — replaced by `customer-serial-resolve.ts` | Simplification | Nested-only lookup |"],
  ["| `src/lib/traceability/observability.ts` | — | `wrapApiHandler`, structured logging, feature flags | Production readiness | Consistent API error handling |",
   "| `src/lib/traceability/observability.ts` | API observability | **DELETED** | Platform removed | — |"],
  ["| `src/app/api/traceability/*` | — | Traceability platform API | May 2026 module | Full traceability operations |",
   "| `src/app/api/traceability/*` | Traceability REST API | **DELETED Jul 2026** (17 routes) | Simplification | — |"],
  ["| `src/app/api/traceability/resolve-serial` | — | Public serial lookup API | Customer migration | Dual-read serial resolution |",
   "| `src/app/api/customer/resolve-serial` | — | Public serial lookup API | Replace traceability route | Nested-only resolution |"],
  ["| `src/app/admin/traceability/*` | — | Traceability admin dashboard | May 2026 module | Operator UI |",
   "| `src/app/admin/traceability/*` | Operator dashboard | **DELETED Jul 2026** | Simplification | — |"],
  ["| `src/app/scan/[token]/page.tsx` | — | Public QR scan page | QR verification | Consumer QR lookup |",
   "| `src/app/scan/[token]/page.tsx` | QR scan page | **DELETED** | QR not used | — |"],
  ["| `src/app/customer/[serialNo]/page.tsx` | Direct firebaseUtil call | API fetch to resolve-serial | Security + dual-read | No client Firestore |",
   "| `src/app/customer/[serialNo]/page.tsx` | Direct firebaseUtil call | API fetch to `/api/customer/resolve-serial` | Security + nested lookup | No client Firestore |"],
  ["| `scratch/migrate_legacy_to_flat.js` | — | Migration script | Data migration | Legacy → flat collections |",
   "| `scratch/migrate_legacy_to_flat.js` | Flat migration script | **DELETED** | Platform removed | — |"],
  ["| `src/lib/legacy-admin-client.ts` | — | Client fetch wrappers for `/api/admin/*` | Type-safe API calls | Admin pages use HTTP not Firestore |",
   "| `src/lib/legacy-admin-client.ts` | — | Client fetch wrappers for `/api/admin/*` | Type-safe API calls | Admin pages use HTTP not Firestore |\n| `src/lib/customer-serial-resolve.ts` | — | Nested serial lookup | Replace legacy-resolve | Customer verification |"],
];
for (const [old, neu] of deletedRows) {
  c = c.replace(old, neu);
}

// firebaseUtil new logic
c = c.replace(
  "- `src/lib/traceability/legacy-resolve.ts` — public lookup\n- `src/lib/legacy-admin-client.ts` — client HTTP wrappers",
  "- `src/lib/customer-serial-resolve.ts` — public serial lookup\n- `src/lib/legacy-admin-client.ts` — client HTTP wrappers"
);
c = c.replace(
  "**Added functions:** See legacy-admin and traceability modules",
  "**Added functions:** See legacy-admin and customer-serial-resolve modules"
);

// useBatchDetails table
c = c.replace(
  "| `handleGeneratePacket` | `legacyAdminGeneratePackets` + `syncFlatPackets` | Write packets + flat sync |",
  "| `handleGeneratePacket` | `legacyAdminGeneratePackets` | Write packets + serialNumbers index |"
);

// Mark traceability admin-writer section as removed
c = c.replace(
  "### `src/lib/traceability/admin-writer.ts` — NEW (May 2026)",
  "### `src/lib/traceability/admin-writer.ts` — **REMOVED** (was May 2026)"
);

// Section 9 folder changes table
c = c.replace(
  "| **Added `src/lib/traceability/`** | New flat traceability platform data layer |",
  "| **Added then removed `src/lib/traceability/`** | Flat platform (May 2026); deleted Jul 2026 |"
);
c = c.replace(
  "| **Added `src/app/api/traceability/`** | REST API for traceability platform |",
  "| **Added then removed `src/app/api/traceability/`** | 17 routes; deleted Jul 2026 |"
);
c = c.replace(
  "| **Added `src/app/admin/traceability/`** | Separate operator UI for traceability roles |",
  "| **Added then removed `src/app/admin/traceability/`** | Operator UI; deleted Jul 2026 |"
);

// Section 9 dependency diagram lines
c = c.replace(
  "                              ──NEW──►  traceability-client.ts\n                              ──NEW──►  legacy-admin/ (server data layer)\n                              ──NEW──►  traceability/ (platform data layer)",
  "                              ──NEW──►  legacy-admin-client.ts\n                              ──NEW──►  legacy-admin/ (server data layer)\n                              ──NEW──►  customer-serial-resolve.ts"
);
c = c.replace(
  "  firebaseUtil.tsx            ──X──►      (deleted → legacy-admin/ + traceability/)",
  "  firebaseUtil.tsx            ──X──►      (deleted → legacy-admin/ + customer-serial-resolve)"
);
c = c.replace(
  "    traceability/             ──NEW──►    traceability/ (full dashboard)",
  "    (removed)                 ──X──►      traceability/ dashboard deleted Jul 2026"
);
c = c.replace(
  "                                          traceability/... (platform REST)",
  "                                          customer/resolve-serial (public lookup)"
);
c = c.replace(
  "                              ──NEW──►  traceability/ (TraceabilityAdminShell)",
  "                              (removed) traceability admin shell deleted"
);
c = c.replace(
  "                              ──NEW──►  traceability-client.ts",
  "                              (removed) traceability-client.ts deleted"
);

// Change 6 implementation note
c = c.replace(
  "| **Implementation** | Block all client writes to traceability collections; server APIs only |",
  "| **Implementation** | Block client writes; server APIs only; nested-only rules (Jul 2026) |"
);

fs.writeFileSync(file, c, "utf8");
console.log("done");
