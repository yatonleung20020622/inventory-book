import * as XLSX from "xlsx";

export const BOX_ITEM_EXCEL_HEADERS = [
  "name",
  "brand",
  "quantity",
  "unit",
  "desc",
] as const;

export type BoxItemExcelHeader = (typeof BOX_ITEM_EXCEL_HEADERS)[number];

export type BoxItemExcelRow = Record<BoxItemExcelHeader, string>;

const SAMPLE_ROW: BoxItemExcelRow = {
  name: "Spare hinge screw",
  brand: "",
  quantity: "4",
  unit: "個",
  desc: "Optional description",
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^\uFEFF/, "")
    .toLowerCase();
}

export function buildBoxItemsExcelTemplate(): Uint8Array {
  const sheet = XLSX.utils.aoa_to_sheet([
    [...BOX_ITEM_EXCEL_HEADERS],
    BOX_ITEM_EXCEL_HEADERS.map((key) => SAMPLE_ROW[key]),
  ]);
  sheet["!cols"] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 10 },
    { wch: 8 },
    { wch: 36 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Box items");
  const bytes = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as number[] | Uint8Array;
  return bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
}

export function parseBoxItemsExcel(
  data: ArrayBuffer,
): { ok: true; items: BoxItemExcelRow[] } | { ok: false; message: string } {
  try {
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { ok: false, message: "Excel file has no sheets." };
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
      sheet,
      {
        header: 1,
        defval: "",
        blankrows: false,
        raw: false,
      },
    );

    if (rows.length === 0) {
      return { ok: false, message: "Excel sheet is empty." };
    }

    const headerCells = (rows[0] ?? []).map(normalizeHeader);
    const missing = BOX_ITEM_EXCEL_HEADERS.filter(
      (header) => !headerCells.includes(header),
    );
    if (missing.length > 0) {
      return {
        ok: false,
        message: `Missing Excel columns: ${missing.join(", ")}. Download the template and try again.`,
      };
    }

    const indexByHeader = Object.fromEntries(
      BOX_ITEM_EXCEL_HEADERS.map((header) => [
        header,
        headerCells.indexOf(header),
      ]),
    ) as Record<BoxItemExcelHeader, number>;

    const items: BoxItemExcelRow[] = [];
    for (let i = 1; i < rows.length; i += 1) {
      const cells = rows[i] ?? [];
      const item = {} as BoxItemExcelRow;
      for (const header of BOX_ITEM_EXCEL_HEADERS) {
        item[header] = String(cells[indexByHeader[header]] ?? "").trim();
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
  } catch {
    return {
      ok: false,
      message: "Could not read Excel file. Use the .xlsx template.",
    };
  }
}
