const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "PROJECT_EVOLUTION_REPORT.md");
let c = fs.readFileSync(file, "utf8");

// Fix remaining corner mojibake: â" + special char → box corners
c = c.replace(/\u00e2\u201d\u0090/g, "\u2510"); // ┐
c = c.replace(/\u00e2\u201d\u008c/g, "\u250c"); // ┌ (if any left)
c = c.replace(/\u00e2\u201d\u0094/g, "\u2514"); // └
c = c.replace(/\u00e2\u201d\u0098/g, "\u2518"); // ┘
c = c.replace(/\u00e2\u201d\u0082/g, "\u2502"); // │
c = c.replace(/\u00e2\u201d\u009c/g, "\u251c"); // ├
c = c.replace(/\u00e2\u201d\u0080/g, "\u2500"); // ─

// Business flow diagram — full replace
c = c.replace(
  /## Complete Business Flow\r?\n\r?\n```[\s\S]*?```/,
  `## Complete Business Flow

\`\`\`
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Admin      │────►│  Product     │────►│  Batch      │────►│  Packets     │
│  Login      │     │  Category    │     │  Creation   │     │  Generation  │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                                                                    │
                    ┌───────────────┐     ┌───────────────┐          │
                    │  Consumer     │◄────│  Serial on    │◄─────────┘
                    │  Verification │     │  Label        │
                    └───────────────┘     └───────────────┘
\`\`\``
);

// Appendix A tree — replace corrupted box chars with ASCII tree
const appendixTree = `# APPENDIX A — CURRENT FOLDER TREE (Jul 2026)

\`\`\`
k2k_traceability/
├── firebase.json, firestore.rules, firestore.indexes.json, storage.rules
├── middleware.ts, next.config.mjs, package.json
├── PROJECT_EVOLUTION_REPORT.md
├── scratch/sync_product_ids_and_serials.js
├── firebase/firebaseConfig.tsx          # Client auth only
├── public/images/, product placeholders
└── src/
    ├── app/
    │   ├── layout.tsx, page.tsx, globals.css
    │   ├── login/page.tsx, unauthorized/page.tsx
    │   ├── admin/
    │   │   ├── layout.tsx               # admin-only guard
    │   │   ├── page.tsx                 # product dashboard
    │   │   ├── add_product/page.tsx
    │   │   └── [productId]/
    │   │       ├── create_batch/page.tsx
    │   │       └── [batchId]/batch_details/page.tsx
    │   ├── customer/
    │   │   ├── page.tsx
    │   │   └── [serialNo]/page.tsx
    │   └── api/
    │       ├── auth/set-claims/route.ts
    │       ├── create-user/route.ts, get-user/route.ts
    │       ├── admin/products/...       # 9 route files
    │       └── customer/resolve-serial/route.ts
    ├── components/
    │   ├── batch/                       # 10 files (hook + UI)
    │   ├── ui/                          # shadcn primitives
    │   ├── Loader.tsx, Navbar.tsx
    ├── contexts/AuthContext.tsx
    └── lib/
        ├── api-auth.ts, firebase-admin.ts
        ├── legacy-admin-client.ts
        ├── customer-serial-resolve.ts
        ├── legacy-admin/                # products, batches, packets, storage, types
        └── utils.ts
\`\`\``;

c = c.replace(
  /# APPENDIX A — CURRENT FOLDER TREE \(Jul 2026\)[\s\S]*?\`\`\`\r?\n\r?\n\*\*Deleted:\*\*/,
  appendixTree + "\n\n**Deleted:**"
);

fs.writeFileSync(file, c, "utf8");
console.log("fixed diagram + appendix");
