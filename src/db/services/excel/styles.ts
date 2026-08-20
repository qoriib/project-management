import type * as ExcelJS from "exceljs";

// ── Formal Institutional Palette (Standar Instansi / Kedinasan / BUMN) ────────
export const FORMAL_STYLE = {
  fontFamily: "Calibri",
  primaryHeaderBg: "FF1F4E78", // Formal Navy Blue
  primaryHeaderText: "FFFFFFFF",
  secondaryHeaderBg: "FFD9E1F2", // Soft Ice Blue
  secondaryHeaderText: "FF000000",
  tableHeaderBg: "FF2F5597", // Deep Blue Table Header
  tableHeaderText: "FFFFFFFF",
  totalRowBg: "FFE7E6E6", // Formal Accounting Light Gray
  totalRowText: "FF000000",
  zebraBg: "FFF2F2F2", // Subtle alternate row
  unplannedRowBg: "FFFFF2CC", // Soft Cream for Non-BOM items
  borderDark: "FF000000", // Solid Black/Dark Gray for formal grid
  borderLight: "FFBFBFBF",
  statusGreenText: "FF006100", // Excel standard soft dark green
  statusRedText: "FF9C0006", // Excel standard soft dark red
  statusNeutralText: "FF1F4E78",
};

export const BORDER_ALL_THIN: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: FORMAL_STYLE.borderDark } },
  left: { style: "thin", color: { argb: FORMAL_STYLE.borderDark } },
  bottom: { style: "thin", color: { argb: FORMAL_STYLE.borderDark } },
  right: { style: "thin", color: { argb: FORMAL_STYLE.borderDark } },
};

export const BORDER_ALL_LIGHT: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: FORMAL_STYLE.borderLight } },
  left: { style: "thin", color: { argb: FORMAL_STYLE.borderLight } },
  bottom: { style: "thin", color: { argb: FORMAL_STYLE.borderLight } },
  right: { style: "thin", color: { argb: FORMAL_STYLE.borderLight } },
};

export const BORDER_ACCOUNTING_TOTAL: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: FORMAL_STYLE.borderDark } },
  left: { style: "thin", color: { argb: FORMAL_STYLE.borderDark } },
  bottom: { style: "double", color: { argb: FORMAL_STYLE.borderDark } },
  right: { style: "thin", color: { argb: FORMAL_STYLE.borderDark } },
};

/**
 * Creates a formal Kop (Letterhead/Document Header) across specified columns.
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
  kop1.font = { name: FORMAL_STYLE.fontFamily, size: 11, bold: true, color: { argb: "FF1F4E78" } };
  kop1.alignment = { vertical: "middle", horizontal: "center" };

  ws.mergeCells(`${startCol}2:${options.endCol}2`);
  const kop2 = ws.getCell(`${startCol}2`);
  kop2.value = options.title;
  kop2.font = { name: FORMAL_STYLE.fontFamily, size: 13, bold: true, color: { argb: "FF000000" } };
  kop2.alignment = { vertical: "middle", horizontal: "center" };

  ws.mergeCells(`${startCol}3:${options.endCol}3`);
  const kop3 = ws.getCell(`${startCol}3`);
  kop3.value = options.subtitle;
  kop3.font = { name: FORMAL_STYLE.fontFamily, size: 10, color: { argb: "FF595959" } };
  kop3.alignment = { vertical: "middle", horizontal: "center" };

  for (let c = startColIdx; c <= options.endColIdx; c++) {
    ws.getRow(3).getCell(c).border = {
      bottom: { style: "medium", color: { argb: FORMAL_STYLE.borderDark } },
    };
  }
}
