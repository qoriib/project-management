/**
 * PDF Styling Constants, Layouts, Margins & Color Palette
 *
 * Pusat konfigurasi tampilan PDF untuk seluruh laporan (Lanskap & Potret):
 * - Dimensi halaman, orientasi, margin, dan posisi startY tabel & kop
 * - Palet warna formal untuk header, banner kategori, sel data, status sel
 * - Pengaturan tipografi dan padding sel (header, body, banner, total)
 * - Skema lebar kolom dan alignment (Laporan Pemenuhan Standar/Periode & Riwayat Transaksi)
 */

export const PDF_FONTS = {
  primary: "helvetica",
};

// Konfigurasi Halaman & Margin

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
  printableWidth: 269, // 297 - (14 + 14)
  kopStartY: 16,
  tableStartY: 27,
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
  printableWidth: 182, // 210 - (14 + 14)
  kopStartY: 16,
  tableStartY: 28,
};

/** Default page configuration (mengarah ke Lanskap untuk Laporan Pemenuhan Utama) */
export const PDF_PAGE = PDF_PAGE_LANDSCAPE;

// Palet Warna Formal

export const PDF_COLORS = {
  // Table Column Header Colors
  tableHeaderBg: [237, 237, 237] as [number, number, number], // #EDEDED
  tableHeaderText: [0, 0, 0] as [number, number, number], // #000000

  // Category & Group Banner Colors
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

// ==========================================
// 3. Alignment & Border Style Base
// ==========================================

export const PDF_TABLE_STYLE = {
  borderWidth: 0.1,
  valign: "middle" as const,
  headerHalign: "center" as const,
  headerValign: "middle" as const,
};

/**
 * Pengaturan dasar gaya tabel PDF.
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

// ==========================================
// 4. Gaya Khusus Banner & Total Row
// ==========================================

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

// ==========================================
// 5. Head & Body Styles per Tabel
// ==========================================

/** Gaya head & body untuk tabel Pemenuhan Volume (Lanskap) */
export const PDF_FULFILLMENT_HEAD_STYLES = {
  ...PDF_TABLE_HEAD_STYLES,
  fontSize: 7.2,
  cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
};

export const PDF_FULFILLMENT_BODY_STYLES = {
  ...PDF_TABLE_BODY_STYLES,
  cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
};

/** Gaya head & body untuk tabel Riwayat Transaksi (Potret) */
export const PDF_TRANSACTION_HISTORY_HEAD_STYLES = {
  ...PDF_TABLE_HEAD_STYLES,
  fontSize: 7,
  cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
};

export const PDF_TRANSACTION_HISTORY_BODY_STYLES = {
  ...PDF_TABLE_BODY_STYLES,
  cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 },
};

// ==========================================
// 6. Skema Kolom Tabel (Width & Alignment)
// ==========================================

export type PdfColumnConfig = {
  cellWidth: number;
  halign: "center" | "left" | "right";
};

/** Skema kolom tabel pemenuhan standar tanpa rentang tanggal (10 kolom, total width 269mm) */
export const PDF_FULFILLMENT_STANDARD_COL_STYLES: Record<number, PdfColumnConfig> = {
  0: { cellWidth: 10, halign: "center" }, // NO
  1: { cellWidth: 24, halign: "center" }, // KODE ITEM
  2: { cellWidth: 85, halign: "left" }, // NAMA ITEM
  3: { cellWidth: 16, halign: "center" }, // SATUAN
  4: { cellWidth: 24, halign: "right" }, // BOQ VOL
  5: { cellWidth: 24, halign: "right" }, // PO VOL
  6: { cellWidth: 20, halign: "right" }, // PO %
  7: { cellWidth: 22, halign: "right" }, // NP DATANG
  8: { cellWidth: 22, halign: "right" }, // NP SISA
  9: { cellWidth: 22, halign: "right" }, // NP %
};

/** Skema kolom tabel pemenuhan dengan filter tanggal (12 kolom, total width 269mm) */
export const PDF_FULFILLMENT_DATE_RANGE_COL_STYLES: Record<number, PdfColumnConfig> = {
  0: { cellWidth: 10, halign: "center" }, // NO
  1: { cellWidth: 24, halign: "center" }, // KODE ITEM
  2: { cellWidth: 59, halign: "left" }, // NAMA ITEM
  3: { cellWidth: 16, halign: "center" }, // SATUAN
  4: { cellWidth: 22, halign: "right" }, // BOQ VOL
  5: { cellWidth: 20, halign: "right" }, // PO PERIODE
  6: { cellWidth: 20, halign: "right" }, // PO KUMULATIF
  7: { cellWidth: 18, halign: "right" }, // PO %
  8: { cellWidth: 20, halign: "right" }, // NP PERIODE
  9: { cellWidth: 20, halign: "right" }, // NP KUMULATIF
  10: { cellWidth: 20, halign: "right" }, // NP SISA
  11: { cellWidth: 20, halign: "right" }, // NP %
};

/** Skema kolom tabel riwayat transaksi (6 kolom, total width 182mm) */
export const PDF_TRANSACTION_HISTORY_COL_STYLES: Record<number, PdfColumnConfig> = {
  0: { cellWidth: 10, halign: "center" }, // NO
  1: { cellWidth: 26, halign: "center" }, // TANGGAL
  2: { cellWidth: 18, halign: "center" }, // TIPE
  3: { cellWidth: 42, halign: "center" }, // NO. REFERENSI
  4: { cellWidth: 56, halign: "left" }, // VENDOR
  5: { cellWidth: 30, halign: "right" }, // VOLUME
};
