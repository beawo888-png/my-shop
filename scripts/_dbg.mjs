import fs from "node:fs";
function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ",") { fields.push(field); field = ""; }
      else { field += c; }
    }
  }
  fields.push(field);
  return fields;
}
console.log("empty test:", JSON.stringify(parseCsvLine(",,,")));
const l = fs.readFileSync("data/menu.csv", "utf8").split(/\r?\n/).filter(x => x.trim() !== "");
console.log("line count:", l.length);
console.log("line2:", JSON.stringify(parseCsvLine(l[1])));
console.log("line3:", JSON.stringify(parseCsvLine(l[2])));
