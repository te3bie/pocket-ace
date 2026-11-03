import { cents, parseDate } from "./finance";
export type ImportedTransaction = {
  externalId: string;
  date: string;
  name: string;
  cents: number;
  category: string;
};
function row(line: string) {
  const cells: string[] = [];
  let value = "",
    quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      cells.push(value.trim());
      value = "";
    } else value += c;
  }
  if (quoted) throw new Error("Unclosed CSV quote.");
  cells.push(value.trim());
  return cells;
}
export function parseCSV(text: string): ImportedTransaction[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/);
  if (lines.length > 1001)
    throw new Error("Import up to 1,000 rows at a time.");
  if (
    row(lines.shift() || "")
      .join(",")
      .toLowerCase() !== "id,date,name,amount,category"
  )
    throw new Error("Expected header: id,date,name,amount,category");
  const ids = new Set<string>();
  return lines.filter(Boolean).map((line, i) => {
    const [id, date, name, amount, category, ...extra] = row(line);
    if (extra.length || !id || !name || !category)
      throw new Error(`Invalid row ${i + 2}.`);
    parseDate(date);
    if (ids.has(id)) throw new Error(`Duplicate id ${id} in file.`);
    ids.add(id);
    return { externalId: id, date, name, cents: cents(amount), category };
  });
}
