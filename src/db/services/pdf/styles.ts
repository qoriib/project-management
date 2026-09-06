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
  // Table Column Header Colors (matches Excel tableHeaderBg #EDEDED and text #000000)
  tableHeaderBg: [237, 237, 237] as [number, number, number], // #EDEDED
  tableHeaderText: [0, 0, 0] as [number, number, number], // #000000

  // Category Banner Colors (matches Excel secondaryHeaderBg #E5E5E5)
  categoryBg: [229, 229, 229] as [number, number, number], // #E5E5E5
  categoryText: [0, 0, 0] as [number, number, number],

  // Summary and Total Row Colors (matches Excel totalRowBg #F2F2F2)
  totalBg: [242, 242, 242] as [number, number, number], // #F2F2F2
  totalText: [0, 0, 0] as [number, number, number],

  // Data Cell Colors (matches Excel exactly)
  bodyCellBg: [255, 255, 255] as [number, number, number],
  unplannedCellBg: [255, 224, 178] as [number, number, number], // #FFE0B2 amber/orange
  budgetOverCellBg: [255, 205, 210] as [number, number, number], // #FFCDD2 soft red

  // Table Border & Separator (uses borderDark for clean, crisp lines)
  borderDark: [0, 0, 0] as [number, number, number], // #000000
  tableBorder: [0, 0, 0] as [number, number, number], // #000000

  // Text Colors
  textDark: [0, 0, 0] as [number, number, number],
  textMuted: [89, 89, 89] as [number, number, number],
};

export const PDF_TABLE_STYLE = {
  borderWidth: 0.18,
};

export const PDF_FONTS = {
  primary: "helvetica",
};
