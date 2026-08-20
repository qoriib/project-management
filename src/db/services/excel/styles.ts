import type * as ExcelJS from "exceljs";

// ── Formal Monochromatic Grayscale Palette (Hitam, Putih, Abu-abu Soft) ────────
export const FORMAL_STYLE = {
  fontFamily: "Calibri",
  // Section Headers (Dark charcoal header with white bold text)
  primaryHeaderBg: "FF262626",
  primaryHeaderText: "FFFFFFFF",
  // Sub-headers / Category bars (Soft neutral gray)
  secondaryHeaderBg: "FFE5E5E5",
  secondaryHeaderText: "FF000000",
  // Table Column Headers (Clean soft light-gray header with black text)
  tableHeaderBg: "FFEDEDED",
  tableHeaderText: "FF000000",
  // Summary & Totals
  totalRowBg: "FFF2F2F2",
  totalRowText: "FF000000",
  // Subtle zebra row for readability
  zebraBg: "FFFAFAFA",
  unplannedRowBg: "FFF5F5F5",
  // Borders
  borderDark: "FF000000",
  borderMedium: "FF595959",
  borderLight: "FFCCCCCC",
  // Status text (Professional neutral)
  statusNeutralText: "FF262626",
  statusMutedText: "FF595959",
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
 * Creates a formal Kop (Letterhead/Document Header) across specified columns in grayscale.
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

  ws.mergeCells(`${startCol}1:${options.endCol}1`);
  const kop1 = ws.getCell(`${startCol}1`);
  kop1.value = options.company_name.toUpperCase();
  kop1.font = { bold: true, color: { argb: "FF000000" }, name: FORMAL_STYLE.fontFamily, size: 11 };
  kop1.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells(`${startCol}2:${options.endCol}2`);
  const kop2 = ws.getCell(`${startCol}2`);
  kop2.value = options.title;
  kop2.font = { bold: true, color: { argb: "FF000000" }, name: FORMAL_STYLE.fontFamily, size: 13 };
  kop2.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells(`${startCol}3:${options.endCol}3`);
  const kop3 = ws.getCell(`${startCol}3`);
  kop3.value = options.subtitle;
  kop3.font = { color: { argb: "FF595959" }, name: FORMAL_STYLE.fontFamily, size: 10 };
  kop3.alignment = { horizontal: "center", vertical: "middle" };

  for (let c = startColIdx; c <= options.endColIdx; c++) {
    ws.getRow(3).getCell(c).border = {
      bottom: { color: { argb: FORMAL_STYLE.borderDark }, style: "medium" },
    };
  }
}
