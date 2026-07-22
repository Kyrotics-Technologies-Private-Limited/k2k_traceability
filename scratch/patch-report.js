const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "PROJECT_EVOLUTION_REPORT.md");
let c = fs.readFileSync(file, "utf8");

c = c.replace(
  /6\. \*\*Consumer purchase\*\*[^\n]+\n7\. \*\*Verification\*\*[^\n]+\n8\. \*\*Recall \(if needed\)\*\*[^\n]+\n/,
  `6. **Consumer purchase** — Consumer enters serial on \`/customer\`.\n7. **Verification** — System resolves serial → product + batch + packet → displays authenticity and quality data.\n`
);

c = c.replace(
  /### QR Scan Request[\s\S]*?```\n\n---\n\n# SECTION 11/,
  `---\n\n# SECTION 11`
);

// Normalize common mojibake sequences
const map = {
  "\u00e2\u20ac\u201d": "\u2014", // â€"
  "\u00e2\u20ac\u201c": "\u2014",
  "\u00e2\u201a\u00ac": "\u2026", // â€¦
  "\u00e2\u2020\u2019": "\u2192", // â†'
  "\u00e2\u2020\u2018": "\u2190",
  "\u00e2\u2013\u00ba": "\u25ba",
  "\u00e2\u2014\u20ac": "\u2500",
};
for (const [bad, good] of Object.entries(map)) {
  c = c.split(bad).join(good);
}

fs.writeFileSync(file, c, "utf8");
console.log("patched");
