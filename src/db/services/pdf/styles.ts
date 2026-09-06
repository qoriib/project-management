/**
 * PDF Styling Constants & Color Palette
 * Designed for A4 Landscape tabular reports with clean visual hierarchy.
 */

export const PDF_PAGE = {
  orientation: "landscape" as const,
  unit: "mm" as const,
  format: "a4" as const,
  margins: {
    top: 12,
    right: 14,
    bottom: 12,
    left: 14,
  },
  pageWidth: 297,
  pageHeight: 210,
  printableWidth: 269, // 297 - 28
};

export const PDF_COLORS = {
  // Table Column Header Colors
  tableHeaderBg: [237, 237, 237] as [number, number, number], // #EDEDED
  tableHeaderText: [0, 0, 0] as [number, number, number], // #000000

  // Category Banner Colors
  categoryBg: [229, 229, 229] as [number, number, number], // #E5E5E5
  categoryText: [0, 0, 0] as [number, number, number],

  // Summary and Total Row Colors
  totalBg: [242, 242, 242] as [number, number, number], // #F2F2F2
  totalText: [0, 0, 0] as [number, number, number],

  // Data Cell Colors
  bodyCellBg: [255, 255, 255] as [number, number, number],
  unplannedCellBg: [255, 224, 178] as [number, number, number], // #FFE0B2 amber/orange
  budgetOverCellBg: [255, 205, 210] as [number, number, number], // #FFCDD2 soft red

  // Table Border & Separator
  borderDark: [0, 0, 0] as [number, number, number], // #000000
  tableBorder: [0, 0, 0] as [number, number, number], // #000000

  // Text Colors
  textDark: [0, 0, 0] as [number, number, number],
  textMuted: [89, 89, 89] as [number, number, number],
};

export const PDF_FONTS = {
  primary: "helvetica",
};

export const PDF_TABLE_STYLE = {
  borderWidth: 0.1,
  valign: "middle" as const,
  headerHalign: "center" as const,
  headerValign: "middle" as const,
};

/**
 * Pengaturan dasar gaya tabel PDF (A4).
 * Seluruh row di-set secara default dengan vertical align 'middle'.
 */
export const PDF_TABLE_BASE_STYLES = {
  font: PDF_FONTS.primary,
  lineWidth: PDF_TABLE_STYLE.borderWidth,
  lineColor: PDF_COLORS.borderDark,
  textColor: PDF_COLORS.textDark,
  valign: PDF_TABLE_STYLE.valign,
};

/**
 * Pengaturan gaya header tabel PDF.
 * Seluruh header di-set secara default dengan horizontal align 'center' dan vertical align 'middle'.
 */
export const PDF_TABLE_HEAD_STYLES = {
  fillColor: PDF_COLORS.tableHeaderBg,
  textColor: PDF_COLORS.tableHeaderText,
  fontStyle: "bold" as const,
  halign: PDF_TABLE_STYLE.headerHalign,
  valign: PDF_TABLE_STYLE.headerValign,
  lineWidth: PDF_TABLE_STYLE.borderWidth,
  lineColor: PDF_COLORS.borderDark,
};

/**
 * Pengaturan gaya body tabel PDF.
 * Seluruh sel body di-set secara default dengan vertical align 'middle'.
 */
export const PDF_TABLE_BODY_STYLES = {
  fontSize: 7,
  lineWidth: PDF_TABLE_STYLE.borderWidth,
  lineColor: PDF_COLORS.borderDark,
  textColor: PDF_COLORS.textDark,
  valign: PDF_TABLE_STYLE.valign,
  fillColor: PDF_COLORS.bodyCellBg,
};
