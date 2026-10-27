import { parseCsv } from "@/lib/csv/items-csv";

export const BOX_ITEM_CSV_HEADERS = [
  "name",
  "brand",
  "quantity",
  "unit",
  "desc",
] as const;

export type BoxItemCsvHeader = (typeof BOX_ITEM_CSV_HEADERS)[number];

export type BoxItemCsvRow = Record<BoxItemCsvHeader, string>;

const SAMPLE_ROW: BoxItemCsvRow = {
  name: "Spare hinge screw",
  brand: "",
  quantity: "4",
  unit: "個",
  desc: "Optional description",
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildBoxItemsCsvTemplate(): string {
  const header = BOX_ITEM_CSV_HEADERS.join(",");
  const sample = BOX_ITEM_CSV_HEADERS.map((key) =>
    escapeCsvCell(SAMPLE_ROW[key]),
  ).join(",");
  return `${header}\n${sample}\n`;
}

export function rowsToBoxItemCsv(
  rows: string[][],
): { ok: true; items: BoxItemCsvRow[] } | { ok: false; message: string } {
  if (rows.length === 0) {
    return { ok: false, message: "CSV is empty." };
  }

  const headerCells = rows[0].map((cell) => cell.trim());
  const missing = BOX_ITEM_CSV_HEADERS.filter(
    (header) => !headerCells.includes(header),
  );
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing CSV columns: ${missing.join(", ")}. Download the template and try again.`,
    };
  }

  const indexByHeader = Object.fromEntries(
    BOX_ITEM_CSV_HEADERS.map((header) => [
      header,
      headerCells.indexOf(header),
    ]),
  ) as Record<BoxItemCsvHeader, number>;

  const items: BoxItemCsvRow[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const cells = rows[i] ?? [];
    const item = {} as BoxItemCsvRow;
    for (const header of BOX_ITEM_CSV_HEADERS) {
      item[header] = (cells[indexByHeader[header]] ?? "").trim();
    }
    if (!item.name) {
      continue;
    }
    items.push(item);
  }

  if (items.length === 0) {
    return {
      ok: false,
      message: "No data rows found. Add at least one item.",
    };
  }

  return { ok: true, items };
}

export function parseBoxItemsCsv(text: string) {
  return rowsToBoxItemCsv(parseCsv(text));
}
