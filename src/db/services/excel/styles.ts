import type * as ExcelJS from "exceljs";

/**
 * Formal Institutional Standard Configuration & Palette (Monochromatic Grayscale + Status Accents)
 */
export const FORMAL_STYLE = {
  fontFamily: "Calibri",
  fontCellSize: 9,
  kopAgencySize: 11,
  kopTitleSize: 12,
  kopSubtitleSize: 9,
  categoryHeaderSize: 10,

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

  // Data Row Colors
  bodyRowBg: "FFFFFFFF",
  unplannedRowBg: "FFFFE0B2", // Kontras amber/orange untuk item belanja di luar rencana (unplanned)
  budgetOverBg: "FFFFCDD2", // Kontras soft red untuk item over budget
  budgetUnderBg: "FFFFFFFF", // Default putih untuk under budget (efisiensi, tidak perlu dikhawatirkan)

  // Border Colors
  borderDark: "FF000000",
  borderMedium: "FF595959",
  borderLight: "FFCCCCCC",

  // Status & Text Colors
  textDark: "FF000000",
  textMuted: "FF595959",
};

/**
 * Row Height Standards
 */
export const EXCEL_ROW_HEIGHT = {
  kopAgency: 20,
  kopTitle: 22,
  kopSubtitle: 18,
  kopSpacer: 10,
  tableHeader: 26,
  tableHeaderGroup: 24,
  categoryHeader: 22,
};

/**
 * Standard Column Widths for Cross-Sheet Consistency
 */
export const EXCEL_COL_WIDTH = {
  category: 16,
  date: 16,
  itemCode: 16,
  itemName: 36,
  no: 6,
  orderCode: 20,
  percentage: 16,
  price: 18,
  qty: 16,
  receiptCode: 20,
  subtotal: 18,
  tax: 16,
  total: 20,
  unit: 10,
  variance: 18,
  vendor: 28,
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

/**
 * Reusable Border Definitions
 */
export const BORDER_ALL_THIN: Partial<ExcelJS.Borders> = {
  bottom: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
  left: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
  right: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
  top: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
};

export const BORDER_ALL_LIGHT: Partial<ExcelJS.Borders> = {
  bottom: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
  left: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
  right: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
  top: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
};

export const BORDER_ACCOUNTING_TOTAL: Partial<ExcelJS.Borders> = {
  bottom: { color: { argb: FORMAL_STYLE.borderMedium }, style: "double" },
  left: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
  right: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
  top: { color: { argb: FORMAL_STYLE.borderMedium }, style: "thin" },
};

export const BORDER_KOP_SEPARATOR: Partial<ExcelJS.Borders> = {
  bottom: { color: { argb: FORMAL_STYLE.borderDark }, style: "medium" },
};

/**
 * Reusable Font Definitions
 */
export const FONT_REGULAR: Partial<ExcelJS.Font> = {
  name: FORMAL_STYLE.fontFamily,
  size: FORMAL_STYLE.fontCellSize,
};

export const FONT_BOLD: Partial<ExcelJS.Font> = {
  bold: true,
  name: FORMAL_STYLE.fontFamily,
  size: FORMAL_STYLE.fontCellSize,
};

export const FONT_TABLE_HEADER: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: FORMAL_STYLE.tableHeaderText },
  name: FORMAL_STYLE.fontFamily,
  size: FORMAL_STYLE.fontCellSize,
};

export const FONT_TOTAL_ROW: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: FORMAL_STYLE.totalRowText },
  name: FORMAL_STYLE.fontFamily,
  size: FORMAL_STYLE.fontCellSize,
};

export const FONT_CATEGORY_HEADER: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: FORMAL_STYLE.textDark },
  name: FORMAL_STYLE.fontFamily,
  size: FORMAL_STYLE.categoryHeaderSize,
};

export const FONT_KOP_AGENCY: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: FORMAL_STYLE.textDark },
  name: FORMAL_STYLE.fontFamily,
  size: FORMAL_STYLE.kopAgencySize,
};

export const FONT_KOP_TITLE: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: FORMAL_STYLE.textDark },
  name: FORMAL_STYLE.fontFamily,
  size: FORMAL_STYLE.kopTitleSize,
};

export const FONT_KOP_SUBTITLE: Partial<ExcelJS.Font> = {
  color: { argb: FORMAL_STYLE.textMuted },
  name: FORMAL_STYLE.fontFamily,
  size: FORMAL_STYLE.kopSubtitleSize,
};

/**
 * Reusable Fill Definitions
 */
export const FILL_TABLE_HEADER: ExcelJS.Fill = {
  fgColor: { argb: FORMAL_STYLE.tableHeaderBg },
  pattern: "solid",
  type: "pattern",
};

export const FILL_SECONDARY_HEADER: ExcelJS.Fill = {
  fgColor: { argb: FORMAL_STYLE.secondaryHeaderBg },
  pattern: "solid",
  type: "pattern",
};

export const FILL_TOTAL_ROW: ExcelJS.Fill = {
  fgColor: { argb: FORMAL_STYLE.totalRowBg },
  pattern: "solid",
  type: "pattern",
};

export const FILL_UNPLANNED_ROW: ExcelJS.Fill = {
  fgColor: { argb: FORMAL_STYLE.unplannedRowBg },
  pattern: "solid",
  type: "pattern",
};

export const FILL_BUDGET_OVER: ExcelJS.Fill = {
  fgColor: { argb: FORMAL_STYLE.budgetOverBg },
  pattern: "solid",
  type: "pattern",
};

export const FILL_BUDGET_UNDER: ExcelJS.Fill = {
  fgColor: { argb: FORMAL_STYLE.budgetUnderBg },
  pattern: "solid",
  type: "pattern",
};

export const FILL_WHITE: ExcelJS.Fill = {
  fgColor: { argb: FORMAL_STYLE.bodyRowBg },
  pattern: "solid",
  type: "pattern",
};

/**
 * Reusable Alignment Definitions
 */
export const ALIGN_CENTER: Partial<ExcelJS.Alignment> = {
  horizontal: "center",
  vertical: "middle",
};

export const ALIGN_LEFT: Partial<ExcelJS.Alignment> = {
  horizontal: "left",
  vertical: "middle",
};

export const ALIGN_RIGHT: Partial<ExcelJS.Alignment> = {
  horizontal: "right",
  vertical: "middle",
};

export const ALIGN_HEADER: Partial<ExcelJS.Alignment> = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};

export const ALIGN_CATEGORY_HEADER: Partial<ExcelJS.Alignment> = {
  horizontal: "left",
  indent: 1,
  vertical: "middle",
};

/**
 * Worksheet Freeze & View Configurations
 */
export const DEFAULT_SHEET_VIEW: Partial<ExcelJS.WorksheetView> = {
  showGridLines: false,
  state: "frozen",
  xSplit: 0,
  ySplit: 4,
};

export const FULFILLMENT_SHEET_VIEW: Partial<ExcelJS.WorksheetView> = {
  showGridLines: false,
  state: "frozen",
  xSplit: 0,
  ySplit: 5,
};

/**
 * Budget Status Types and Helper Functions
 */
export type BudgetStatus = "over" | "under" | "unplanned" | "normal";

export function getBudgetStatusColor(status: BudgetStatus): string {
  switch (status) {
    case "over":
      return FORMAL_STYLE.budgetOverBg;
    case "unplanned":
      return FORMAL_STYLE.unplannedRowBg;
    case "under":
    case "normal":
    default:
      return FORMAL_STYLE.bodyRowBg;
  }
}

export function getBudgetStatusFill(status: BudgetStatus): ExcelJS.Fill {
  switch (status) {
    case "over":
      return FILL_BUDGET_OVER;
    case "unplanned":
      return FILL_UNPLANNED_ROW;
    case "under":
    case "normal":
    default:
      return FILL_WHITE;
  }
}
