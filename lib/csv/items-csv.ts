export const ITEM_CSV_HEADERS = [
  "name",
  "brand",
  "majorColor",
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

/** Headers for Export CSV / Updates from CSV (id required for updates). */
export const ITEM_UPDATE_CSV_HEADERS = [
  "id",
  "name",
  "brand",
  "majorColor",
  "desc",
  "quantity",
  "unit",
  "estimatedPrice",
  "actualPrice",
  "isBox",
  "boxPurpose",
  "purchaseDate",
  "notice",
  "remarks",
  "location",
] as const;

export type ItemUpdateCsvHeader = (typeof ITEM_UPDATE_CSV_HEADERS)[number];

export type ItemUpdateCsvRow = Record<ItemUpdateCsvHeader, string>;

export type ItemExportSource = {
  id: string;
  name: string;
  brand: string;
  majorColor: string;
  desc: string;
  quantity: number;
  unit: string;
  estimatedPrice: string;
  actualPrice: string;
  isBox: boolean;
  boxPurpose: string;
  purchaseDate: string;
  notice: string;
  remarks: string;
  locationName: string | null;
};

const SAMPLE_ROW: ItemCsvRow = {
  name: "USB-C 充電線",
  brand: "Apple",
  majorColor: "#000000",
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

export function buildItemsExportCsv(items: ItemExportSource[]): string {
  const header = ITEM_UPDATE_CSV_HEADERS.join(",");
  const lines = items.map((item) =>
    ITEM_UPDATE_CSV_HEADERS.map((key) => {
      switch (key) {
        case "id":
          return escapeCsvCell(item.id);
        case "name":
          return escapeCsvCell(item.name);
        case "brand":
          return escapeCsvCell(item.brand);
        case "majorColor":
          return escapeCsvCell(item.majorColor);
        case "desc":
          return escapeCsvCell(item.desc);
        case "quantity":
          return escapeCsvCell(String(item.quantity));
        case "unit":
          return escapeCsvCell(item.unit);
        case "estimatedPrice":
          return escapeCsvCell(item.estimatedPrice);
        case "actualPrice":
          return escapeCsvCell(item.actualPrice);
        case "isBox":
          return escapeCsvCell(item.isBox ? "true" : "false");
        case "boxPurpose":
          return escapeCsvCell(item.boxPurpose);
        case "purchaseDate":
          return escapeCsvCell(item.purchaseDate);
        case "notice":
          return escapeCsvCell(item.notice);
        case "remarks":
          return escapeCsvCell(item.remarks);
        case "location":
          return escapeCsvCell(item.locationName ?? "");
        default: {
          const _exhaustive: never = key;
          return _exhaustive;
        }
      }
    }).join(","),
  );
  return `${header}\n${lines.join("\n")}${lines.length > 0 ? "\n" : ""}`;
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

export function rowsToItemUpdateCsv(
  rows: string[][],
): { ok: true; items: ItemUpdateCsvRow[] } | { ok: false; message: string } {
  if (rows.length === 0) {
    return { ok: false, message: "CSV is empty." };
  }

  const headerCells = rows[0].map((cell) => cell.trim());
  const missing = ITEM_UPDATE_CSV_HEADERS.filter(
    (header) => !headerCells.includes(header),
  );
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing CSV columns: ${missing.join(", ")}. Export CSV and try again.`,
    };
  }

  const indexByHeader = Object.fromEntries(
    ITEM_UPDATE_CSV_HEADERS.map((header) => [
      header,
      headerCells.indexOf(header),
    ]),
  ) as Record<ItemUpdateCsvHeader, number>;

  const items: ItemUpdateCsvRow[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const cells = rows[i];
    const item = {} as ItemUpdateCsvRow;
    for (const header of ITEM_UPDATE_CSV_HEADERS) {
      item[header] = (cells[indexByHeader[header]] ?? "").trim();
    }
    if (!item.id && !item.name) {
      continue;
    }
    items.push(item);
  }

  if (items.length === 0) {
    return { ok: false, message: "No data rows found. Add at least one item." };
  }

  return { ok: true, items };
}

export function parseIsBoxCell(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes" ||
    normalized === "y"
  );
}
