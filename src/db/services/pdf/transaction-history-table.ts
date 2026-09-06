import type jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import { formatItemCode } from "@/utils/formatters";
import { PDF_COLORS, PDF_FONTS, PDF_TABLE_STYLE } from "./styles";
import type { TransactionHistoryPdfContext } from "./types";
import { formatDate, formatQty, renderPdfKop } from "./utils";

/**
 * Merender Bagian Laporan Riwayat Transaksi per Item (Orientasi Potret pada Halaman Baru).
 */
export function renderTransactionHistorySection(doc: jsPDF, context: TransactionHistoryPdfContext): void {
  const { project_name: projectName, company_name: companyName, period, itemLogs } = context;

  // 1. Tambah Halaman Baru Format Potret (A4: 210 x 297 mm)
  doc.addPage("a4", "portrait");

  const portraitMarginLeft = 14;
  const portraitMarginRight = 14;
  const portraitPrintableWidth = 210 - portraitMarginLeft - portraitMarginRight; // 182 mm

  // 2. Render Kop Formal Bagian Riwayat Transaksi
  renderPdfKop(doc, {
    title: "RIWAYAT TRANSAKSI",
    projectName,
    companyName,
    period,
    pageWidth: 210,
    startY: 16,
  });

  let currentY = 29;

  const validItemLogs = (itemLogs || []).filter((entry) => entry.logs && entry.logs.length > 0);

  if (validItemLogs.length === 0) {
    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text("Tidak ada riwayat transaksi pada item untuk periode ini.", 210 / 2, 40, { align: "center" });
    return;
  }

  for (const { item, logs } of validItemLogs) {
    // Cek apakah sisa ruang halaman cukup untuk banner item + header tabel + minimal 2 baris (~35 mm)
    if (currentY + 35 > 297 - 15) {
      doc.addPage("a4", "portrait");
      currentY = 16;
    }

    // 1. Render Banner Header Item
    const bannerHeight = 6.5;
    doc.setFillColor(...PDF_COLORS.tableHeaderBg);
    doc.setDrawColor(...PDF_COLORS.borderDark);
    doc.setLineWidth(PDF_TABLE_STYLE.borderWidth);
    doc.rect(portraitMarginLeft, currentY, portraitPrintableWidth, bannerHeight, "FD");

    // Label Item (Kiri): truncate jika terlalu panjang agar tidak bertumpuk dengan meta kanan
    doc.setFont(PDF_FONTS.primary, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.textDark);
    const itemCode = formatItemCode(item) || item.item_code || "";
    const itemCodePrefix = itemCode ? `${itemCode} - ` : "";
    const itemTitle = `${itemCodePrefix}${item.item_name}`;

    const maxTitleWidth = 98; // mm
    let displayedTitle = itemTitle;
    while (doc.getTextWidth(displayedTitle) > maxTitleWidth && displayedTitle.length > 4) {
      displayedTitle = `${displayedTitle.slice(0, -4)}...`;
    }
    doc.text(displayedTitle, portraitMarginLeft + 2, currentY + 4.3);

    // Metadata Item (Kanan): Kategori, Satuan, Total PO, Total NP
    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.textMuted);
    const poQty = item.cumulative_ordered ?? item.total_ordered;
    const npQty = item.cumulative_delivered ?? item.total_delivered;
    const itemMeta = `Kategori: ${item.category || "LAINNYA"} | Satuan: ${item.unit || "-"} | PO: ${formatQty(poQty)} | NP: ${formatQty(npQty)}`;
    doc.text(itemMeta, portraitMarginLeft + portraitPrintableWidth - 2, currentY + 4.3, { align: "right" });

    currentY += bannerHeight;

    // 2. Render Tabel Riwayat Transaksi Item
    const logRows: RowInput[] = logs.map((log, logIdx) => [
      logIdx + 1,
      formatDate(log.date),
      log.type === "Order" ? "PO" : "NP",
      log.reference || "-",
      log.vendor_name || "-",
      `${formatQty(log.qty)} ${item.unit || ""}`.trim(),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: portraitMarginLeft, right: portraitMarginRight, top: 14, bottom: 14 },
      theme: "plain",
      styles: {
        font: PDF_FONTS.primary,
        lineWidth: PDF_TABLE_STYLE.borderWidth,
        lineColor: PDF_COLORS.borderDark,
      },
      head: [["NO", "TANGGAL", "TIPE", "NO. REFERENSI", "VENDOR", "VOLUME"]],
      body: logRows,
      headStyles: {
        fillColor: PDF_COLORS.tableHeaderBg,
        textColor: PDF_COLORS.tableHeaderText,
        fontStyle: "bold",
        fontSize: 7,
        lineWidth: PDF_TABLE_STYLE.borderWidth,
        lineColor: PDF_COLORS.borderDark,
        cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
      },
      bodyStyles: {
        fontSize: 7,
        lineWidth: PDF_TABLE_STYLE.borderWidth,
        lineColor: PDF_COLORS.borderDark,
        textColor: PDF_COLORS.textDark,
        cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 },
        fillColor: PDF_COLORS.bodyCellBg,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 26, halign: "center" },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 42, halign: "center" },
        4: { cellWidth: 56, halign: "left" },
        5: { cellWidth: 30, halign: "right" },
      },
      didParseCell: (cellData) => {
        if (cellData.section === "body") {
          cellData.cell.styles.lineWidth = PDF_TABLE_STYLE.borderWidth;
          cellData.cell.styles.lineColor = PDF_COLORS.borderDark;

          if (cellData.column.index === 2) {
            const val = cellData.cell.raw;
            if (val === "PO") {
              cellData.cell.styles.fontStyle = "bold";
              cellData.cell.styles.textColor = [2, 132, 199];
            } else if (val === "NP") {
              cellData.cell.styles.fontStyle = "bold";
              cellData.cell.styles.textColor = [22, 163, 74];
            }
          }
        }
      },
    });

    // Update currentY dari posisi akhir tabel + jarak jeda 5mm untuk item berikutnya
    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }
}
