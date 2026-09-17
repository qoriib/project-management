export const PDF_FONTS = {
  primary: "helvetica",
};

export const PDF_PAGE_LANDSCAPE = {
  orientation: "landscape" as const,
  unit: "mm" as const,
  format: "a4" as const,
  margins: {
    top: 15,
    right: 14,
    bottom: 14,
    left: 14,
  },
  pageWidth: 297,
  pageHeight: 210,
  printableWidth: 269,
  kopStartY: 13,
  tableStartY: 23,
};

export const PDF_PAGE_PORTRAIT = {
  orientation: "portrait" as const,
  unit: "mm" as const,
  format: "a4" as const,
  margins: {
    top: 14,
    right: 14,
    bottom: 14,
    left: 14,
  },
  pageWidth: 210,
  pageHeight: 297,
  printableWidth: 182,
  kopStartY: 13,
  tableStartY: 23,
};

export const PDF_COLORS = {
  tableHeaderBg: [237, 237, 237] as [number, number, number],
  tableHeaderText: [0, 0, 0] as [number, number, number],
  categoryBg: [229, 229, 229] as [number, number, number],
  categoryText: [0, 0, 0] as [number, number, number],
  totalBg: [242, 242, 242] as [number, number, number],
  totalText: [0, 0, 0] as [number, number, number],
  bodyCellBg: [255, 255, 255] as [number, number, number],
  unplannedCellBg: [255, 224, 178] as [number, number, number],
  budgetOverCellBg: [255, 205, 210] as [number, number, number],
  borderDark: [0, 0, 0] as [number, number, number],
  tableBorder: [0, 0, 0] as [number, number, number],
  textDark: [0, 0, 0] as [number, number, number],
  textMuted: [89, 89, 89] as [number, number, number],

  // Warna Khusus Purchase Order (Header putih/transparan, border hitam tegas)
  poHeaderBg: [255, 255, 255] as [number, number, number],
  poHeaderText: [0, 0, 0] as [number, number, number],

  // Warna Khusus Asset Control (Sesuai referensi visual dokumen fisik)
  assetOrange: [227, 108, 10] as [number, number, number], // #E36C0A untuk tulisan "ASSET"
  assetControlDark: [38, 50, 56] as [number, number, number], // #263238 untuk tulisan "CONTROL"
  assetTitleRed: [192, 57, 43] as [number, number, number], // #C0392B untuk "FORM PERMINTAAN BARANG/ALAT"
  assetTableOlive: [198, 216, 149] as [number, number, number], // #C6D895 hijau muda/olive untuk header tabel
  assetTableOliveText: [0, 0, 0] as [number, number, number],
};

export const PDF_TABLE_STYLE = {
  borderWidth: 0.1,
  valign: "middle" as const,
  headerHalign: "center" as const,
  headerValign: "middle" as const,
};

export const PDF_TABLE_BASE_STYLES = {
  font: PDF_FONTS.primary,
  lineWidth: PDF_TABLE_STYLE.borderWidth,
  lineColor: PDF_COLORS.borderDark,
  textColor: PDF_COLORS.textDark,
  valign: PDF_TABLE_STYLE.valign,
};

export const PDF_TABLE_HEAD_STYLES = {
  fillColor: PDF_COLORS.tableHeaderBg,
  textColor: PDF_COLORS.tableHeaderText,
  fontStyle: "bold" as const,
  halign: PDF_TABLE_STYLE.headerHalign,
  valign: PDF_TABLE_STYLE.headerValign,
  lineWidth: PDF_TABLE_STYLE.borderWidth,
  lineColor: PDF_COLORS.borderDark,
};

export const PDF_TABLE_BODY_STYLES = {
  fontSize: 7,
  lineWidth: PDF_TABLE_STYLE.borderWidth,
  lineColor: PDF_COLORS.borderDark,
  textColor: PDF_COLORS.textDark,
  valign: PDF_TABLE_STYLE.valign,
  fillColor: PDF_COLORS.bodyCellBg,
};

export const PDF_TABLE_CATEGORY_BANNER_STYLES = {
  fillColor: PDF_COLORS.categoryBg,
  textColor: PDF_COLORS.categoryText,
  fontStyle: "bold" as const,
  halign: "left" as const,
  valign: PDF_TABLE_STYLE.valign,
  fontSize: 7.5,
  lineWidth: PDF_TABLE_STYLE.borderWidth,
  lineColor: PDF_COLORS.borderDark,
  cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
};

export const PDF_TABLE_HISTORY_BANNER_STYLES = {
  fillColor: PDF_COLORS.categoryBg,
  textColor: PDF_COLORS.categoryText,
  fontStyle: "bold" as const,
  fontSize: 7.5,
  halign: "left" as const,
  valign: PDF_TABLE_STYLE.valign,
  lineWidth: PDF_TABLE_STYLE.borderWidth,
  lineColor: PDF_COLORS.borderDark,
  cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
};

export const PDF_TABLE_TOTAL_ROW_STYLES = {
  fontStyle: "bold" as const,
  fillColor: PDF_COLORS.totalBg,
  textColor: PDF_COLORS.totalText,
  lineWidth: PDF_TABLE_STYLE.borderWidth,
  lineColor: PDF_COLORS.borderDark,
  valign: PDF_TABLE_STYLE.valign,
};

export const PDF_TABLE_TOTAL_LABEL_STYLES = {
  ...PDF_TABLE_TOTAL_ROW_STYLES,
  halign: "right" as const,
  fontSize: 7.5,
};

export const PDF_FULFILLMENT_HEAD_STYLES = {
  ...PDF_TABLE_HEAD_STYLES,
  fontSize: 7.2,
  cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
};

export const PDF_FULFILLMENT_BODY_STYLES = {
  ...PDF_TABLE_BODY_STYLES,
  cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
};

export const PDF_TRANSACTION_HISTORY_HEAD_STYLES = {
  ...PDF_TABLE_HEAD_STYLES,
  fontSize: 7,
  cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
};

export const PDF_TRANSACTION_HISTORY_BODY_STYLES = {
  ...PDF_TABLE_BODY_STYLES,
  cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 },
};

export type PdfColumnConfig = {
  cellWidth: number;
  halign: "center" | "left" | "right";
};

export const PDF_FULFILLMENT_STANDARD_COL_STYLES: Record<number, PdfColumnConfig> = {
  0: { cellWidth: 10, halign: "center" },
  1: { cellWidth: 24, halign: "center" },
  2: { cellWidth: 107, halign: "left" },
  3: { cellWidth: 16, halign: "center" },
  4: { cellWidth: 28, halign: "right" },
  5: { cellWidth: 28, halign: "right" },
  6: { cellWidth: 14, halign: "right" },
  7: { cellWidth: 28, halign: "right" },
  8: { cellWidth: 14, halign: "right" },
};

export const PDF_FULFILLMENT_DATE_RANGE_COL_STYLES: Record<number, PdfColumnConfig> = {
  0: { cellWidth: 10, halign: "center" },
  1: { cellWidth: 24, halign: "center" },
  2: { cellWidth: 81, halign: "left" },
  3: { cellWidth: 16, halign: "center" },
  4: { cellWidth: 24, halign: "right" },
  5: { cellWidth: 22, halign: "right" },
  6: { cellWidth: 22, halign: "right" },
  7: { cellWidth: 13, halign: "right" },
  8: { cellWidth: 22, halign: "right" },
  9: { cellWidth: 22, halign: "right" },
  10: { cellWidth: 13, halign: "right" },
};

export const PDF_TRANSACTION_HISTORY_COL_STYLES: Record<number, PdfColumnConfig> = {
  0: { cellWidth: 10, halign: "center" },
  1: { cellWidth: 26, halign: "center" },
  2: { cellWidth: 18, halign: "center" },
  3: { cellWidth: 42, halign: "center" },
  4: { cellWidth: 56, halign: "left" },
  5: { cellWidth: 30, halign: "right" },
};

// ============================================================
// KONFIGURASI LAYOUT & TABEL PURCHASE ORDER
// ============================================================
export const PO_LAYOUT = {
  titleFontSize: 16,
  titleUnderlineWidth: 0.4,
  headerInfoStartX: 112,
  headerInfoColonX: 138,
  headerInfoValueX: 141,
  minGridRows: 10,
  signatureHeight: 22,
};

export const PDF_PURCHASE_ORDER_COL_STYLES: Record<number, PdfColumnConfig> = {
  0: { cellWidth: 14, halign: "center" },
  1: { cellWidth: 70, halign: "left" },
  2: { cellWidth: 42, halign: "center" },
  3: { cellWidth: 56, halign: "center" },
};

export const PDF_PURCHASE_ORDER_HEAD_STYLES = {
  ...PDF_TABLE_HEAD_STYLES,
  fillColor: PDF_COLORS.poHeaderBg,
  textColor: PDF_COLORS.poHeaderText,
  fontSize: 9,
  fontStyle: "bold" as const,
  cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
};

export const PDF_PURCHASE_ORDER_BODY_STYLES = {
  ...PDF_TABLE_BODY_STYLES,
  fontSize: 8.5,
  cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
};

// ============================================================
// KONFIGURASI LAYOUT & TABEL ASSET CONTROL / FORM PERMINTAAN
// ============================================================
export const ASSET_LAYOUT = {
  leftBlockColonX: 42,
  leftBlockValueX: 45,
  rightBlockX: 150,
  minGridRows: 8,
  signatureHeight: 18,
};

export const PDF_ASSET_REQUEST_COL_STYLES: Record<number, PdfColumnConfig> = {
  0: { cellWidth: 12, halign: "center" },
  1: { cellWidth: 63, halign: "left" },
  2: { cellWidth: 24, halign: "center" },
  3: { cellWidth: 18, halign: "center" },
  4: { cellWidth: 18, halign: "center" },
  5: { cellWidth: 47, halign: "left" },
};

export const PDF_ASSET_REQUEST_HEAD_STYLES = {
  ...PDF_TABLE_HEAD_STYLES,
  fillColor: PDF_COLORS.assetTableOlive,
  textColor: PDF_COLORS.assetTableOliveText,
  fontSize: 8.5,
  fontStyle: "bold" as const,
  cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
};

export const PDF_ASSET_REQUEST_BODY_STYLES = {
  ...PDF_TABLE_BODY_STYLES,
  fontSize: 8,
  cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
};
