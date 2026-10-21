export const ITEM_CSV_HEADERS = [
  "name",
  "brand",
  "desc",
  "quantity",
  "unit",
  "estimatedPrice",
  "purchaseDate",
  "notice",
  "remarks",
  "location",
] as const;

export type ItemCsvHeader = (typeof ITEM_CSV_HEADERS)[number];

export type ItemCsvRow = Record<ItemCsvHeader, string>;

const SAMPLE_ROW: ItemCsvRow = {
  name: "USB-C 充電線",
  brand: "Apple",
  desc: "Optional description",
  quantity: "1",
  unit: "個",
  estimatedPrice: "120 HKD",
  purchaseDate: "2024-01-15",
  notice: "",
  remarks: "",
  location: "Home",
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildItemCsvTemplate(): string {
  const header = ITEM_CSV_HEADERS.join(",");
  const sample = ITEM_CSV_HEADERS.map((key) =>
    escapeCsvCell(SAMPLE_ROW[key]),
  ).join(",");
  return `${header}\n${sample}\n`;
}

/** Minimal CSV parser supporting quoted fields and commas inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((value) => value.trim() !== ""));
}

export function rowsToItemCsv(
  rows: string[][],
): { ok: true; items: ItemCsvRow[] } | { ok: false; message: string } {
  if (rows.length === 0) {
    return { ok: false, message: "CSV is empty." };
  }

  const headerCells = rows[0].map((cell) => cell.trim());
  const missing = ITEM_CSV_HEADERS.filter(
    (header) => !headerCells.includes(header),
  );
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing CSV columns: ${missing.join(", ")}. Download the template and try again.`,
    };
  }

  const indexByHeader = Object.fromEntries(
    ITEM_CSV_HEADERS.map((header) => [header, headerCells.indexOf(header)]),
  ) as Record<ItemCsvHeader, number>;

  const items: ItemCsvRow[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const cells = rows[i];
    const item = {} as ItemCsvRow;
    for (const header of ITEM_CSV_HEADERS) {
      item[header] = (cells[indexByHeader[header]] ?? "").trim();
    }
    // Skip blank example-like empty name rows
    if (!item.name) {
      continue;
    }
    items.push(item);
  }

  if (items.length === 0) {
    return { ok: false, message: "No data rows found. Add at least one item." };
  }

  return { ok: true, items };
}
