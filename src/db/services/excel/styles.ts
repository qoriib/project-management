import type * as ExcelJS from "exceljs";

/**
 * Formal Institutional Standard Configuration & Palette (Monochromatic Grayscale)
 */
export const FORMAL_STYLE = {
  fontFamily: "Calibri",

  // Header and Title Colors
  primaryHeaderBg: "FF262626",
  primaryHeaderText: "FFFFFFFF",
  secondaryHeaderBg: "FFE5E5E5",
  secondaryHeaderText: "FF000000",

  // Table Column Header Colors
  tableHeaderBg: "FFEDEDED",
  tableHeaderText: "FF000000",

  // Summary and Total Row Colors
  totalRowBg: "FFF2F2F2",
  totalRowText: "FF000000",

  // Data Row Alternation Colors
  zebraBg: "FFFAFAFA",
  unplannedRowBg: "FFF5F5F5",

  // Border Colors
  borderDark: "FF000000",
  borderMedium: "FF595959",
  borderLight: "FFCCCCCC",

  // Status & Text Colors
  textDark: "FF000000",
  textMuted: "FF595959",
};

/**
 * Standard Institutional Number Formats
 */
export const EXCEL_NUM_FMT = {
  currency: "#,##0;(#,##0);-",
  quantity: "#,##0.00;(#,##0.00);-",
  percentage: "0.0%;-0.0%;0.0%",
  integer: "#,##0;(#,##0);-",
};

export const BORDER_ALL_THIN: Partial<ExcelJS.Borders> = {
  bottom: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
  left: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
  right: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
  top: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
};

export const BORDER_ALL_LIGHT: Partial<ExcelJS.Borders> = {
  bottom: { color: { argb: FORMAL_STYLE.borderLight }, style: "thin" },
  left: { color: { argb: FORMAL_STYLE.borderLight }, style: "thin" },
  right: { color: { argb: FORMAL_STYLE.borderLight }, style: "thin" },
  top: { color: { argb: FORMAL_STYLE.borderLight }, style: "thin" },
};

export const BORDER_ACCOUNTING_TOTAL: Partial<ExcelJS.Borders> = {
  bottom: { color: { argb: FORMAL_STYLE.borderDark }, style: "double" },
  left: { color: { argb: FORMAL_STYLE.borderDark }, style: "thin" },
  right: { color: { argb: FORMAL_STYLE.borderDark }, style: "thin" },
  top: { color: { argb: FORMAL_STYLE.borderDark }, style: "thin" },
};

/**
 * Format ISO date string (YYYY-MM-DD) to Indonesian institutional date (DD/MM/YYYY).
 */
export function formatToDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Creates a formal Kop (Letterhead / Document Header) across specified columns in grayscale.
 */
export function createFormalKop(
  ws: ExcelJS.Worksheet,
  options: {
    startCol?: string;
    endCol: string;
    endColIdx: number;
    startColIdx?: number;
    company_name: string;
    title: string;
    subtitle: string;
  },
) {
  const startCol = options.startCol ?? "A";
  const startColIdx = options.startColIdx ?? 1;

  // Row 1: Company / Agency Name
  ws.mergeCells(`${startCol}1:${options.endCol}1`);
  const kop1 = ws.getCell(`${startCol}1`);
  kop1.value = options.company_name.toUpperCase();
  kop1.font = { bold: true, color: { argb: FORMAL_STYLE.textDark }, name: FORMAL_STYLE.fontFamily, size: 11 };
  kop1.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 20;

  // Row 2: Report Title
  ws.mergeCells(`${startCol}2:${options.endCol}2`);
  const kop2 = ws.getCell(`${startCol}2`);
  kop2.value = options.title;
  kop2.font = { bold: true, color: { argb: FORMAL_STYLE.textDark }, name: FORMAL_STYLE.fontFamily, size: 12 };
  kop2.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 22;

  // Row 3: Subtitle / Metadata (Project, Fiscal Year, Period)
  ws.mergeCells(`${startCol}3:${options.endCol}3`);
  const kop3 = ws.getCell(`${startCol}3`);
  kop3.value = options.subtitle;
  kop3.font = { color: { argb: FORMAL_STYLE.textMuted }, name: FORMAL_STYLE.fontFamily, size: 9 };
  kop3.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(3).height = 18;

  // Bottom Border separator on Row 3
  for (let c = startColIdx; c <= options.endColIdx; c++) {
    ws.getRow(3).getCell(c).border = {
      bottom: { color: { argb: FORMAL_STYLE.borderDark }, style: "medium" },
    };
  }

  // Row 4: Spacer
  ws.getRow(4).height = 10;
}

export interface SheetColumnConfig {
  header: string;
  key: string;
  width: number;
}

/**
 * Standard table column header renderer at a given row (default row 5).
 */
export function renderTableHeaderRow(ws: ExcelJS.Worksheet, columns: SheetColumnConfig[], rowIdx = 5): void {
  const headerRow = ws.getRow(rowIdx);
  headerRow.height = 26;

  columns.forEach((col, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: FORMAL_STYLE.tableHeaderText }, name: FORMAL_STYLE.fontFamily, size: 9 };
    cell.fill = { fgColor: { argb: FORMAL_STYLE.tableHeaderBg }, pattern: "solid", type: "pattern" };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = BORDER_ALL_THIN;
  });
}
