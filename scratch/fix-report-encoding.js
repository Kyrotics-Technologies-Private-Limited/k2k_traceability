const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "..", "PROJECT_EVOLUTION_REPORT.md");
let c = fs.readFileSync(file, "utf8");
const fixes = [
  [/â€"/g, "—"],
  [/â€¦/g, "…"],
  [/â†'/g, "→"],
  [/â–º/g, "►"],
  [/â—„/g, "◄"],
];
for (const [re, rep] of fixes) c = c.replace(re, rep);
fs.writeFileSync(file, c, "utf8");
console.log("done");
