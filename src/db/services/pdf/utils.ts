import type jsPDF from "jspdf";
import { PDF_COLORS, PDF_FONTS, PDF_PAGE } from "./styles";
import type { PdfKopOptions } from "./types";

export { formatDate, formatPercentage, formatQty } from "@/utils/formatters";

/**
 * Merender Kop Dokumen Formal (Judul, Subtitle, dan Garis Pemisah).
 */
export function renderPdfKop(doc: jsPDF, options: PdfKopOptions): void {
  const { title, projectName, companyName, period, pageWidth, startY = 16 } = options;

  // Judul
  doc.setFont(PDF_FONTS.primary, "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PDF_COLORS.textDark);
  doc.text(title, pageWidth / 2, startY, { align: "center" });

  // Subtitle
  doc.setFont(PDF_FONTS.primary, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.textMuted);
  const subtitleText = `${projectName} | ${companyName} | ${period}`;
  doc.text(subtitleText, pageWidth / 2, startY + 5.5, { align: "center" });
}

/**
 * Merender footer nomor halaman dan timestamp dinamis yang mendukung orientasi campuran (Lanskap & Potret).
 */
export function renderPdfFooter(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages();
  const printTimestamp = new Date().toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const marginLeft = PDF_PAGE.margins.left;
  const marginRight = PDF_PAGE.margins.right;

  for (let pageIndex = 1; pageIndex <= totalPages; pageIndex++) {
    doc.setPage(pageIndex);
    const currentPageWidth = doc.internal.pageSize.getWidth();
    const currentPageHeight = doc.internal.pageSize.getHeight();
    const currentPrintableWidth = currentPageWidth - marginLeft - marginRight;

    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.textMuted);

    // Footer Kiri: Timestamp
    doc.text(`Dicetak pada: ${printTimestamp}`, marginLeft, currentPageHeight - 7);

    // Footer Kanan: Nomor Halaman
    const pageString = `Halaman ${pageIndex} dari ${totalPages}`;
    doc.text(pageString, marginLeft + currentPrintableWidth, currentPageHeight - 7, { align: "right" });
  }
}
