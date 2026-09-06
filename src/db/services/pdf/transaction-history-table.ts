import autoTable, { type RowInput } from "jspdf-autotable";
import { formatItemCode } from "@/utils/formatters";
import {
  PDF_COLORS,
  PDF_FONTS,
  PDF_TABLE_BASE_STYLES,
  PDF_TABLE_BODY_STYLES,
  PDF_TABLE_HEAD_STYLES,
  PDF_TABLE_STYLE,
} from "./styles";
import { formatDate, formatQty, renderPdfKop } from "./utils";
import type { TransactionHistoryPdfContext } from "./types";
import type jsPDF from "jspdf";

export function renderTransactionHistorySection(doc: jsPDF, context: TransactionHistoryPdfContext): void {
  const { project_name: projectName, company_name: companyName, period, itemLogs } = context;

  // 1. Tambah Halaman Baru Format Potret (A4: 210 x 297 mm)
  doc.addPage("a4", "portrait");

  const portraitMarginLeft = 14;
  const portraitMarginRight = 14;
  const portraitPrintableWidth = 210 - portraitMarginLeft - portraitMarginRight;

  // 2. Render Kop Formal Bagian Riwayat Transaksi
  renderPdfKop(doc, {
    title: "RIWAYAT TRANSAKSI",
    projectName,
    companyName,
    period,
    pageWidth: 210,
    startY: 16,
  });

  const validItemLogs = (itemLogs || []).filter((entry) => entry.logs && entry.logs.length > 0);

  if (validItemLogs.length === 0) {
    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text("Tidak ada riwayat transaksi pada item untuk periode ini.", 210 / 2, 40, { align: "center" });
    return;
  }

  // 3. Bangun Baris Body untuk Satu Tabel Terpadu
  const tableBody: RowInput[] = [];

  for (const { item, logs } of validItemLogs) {
    const itemCode = formatItemCode(item) || item.item_code || "";
    const itemCodePrefix = itemCode ? `${itemCode} - ` : "";
    const itemTitle = `${itemCodePrefix}${item.item_name}`;
    const poQty = item.cumulative_ordered ?? item.total_ordered;
    const npQty = item.cumulative_delivered ?? item.total_delivered;
    const itemMeta = `Kategori: ${item.category || "LAINNYA"} | Satuan: ${item.unit || "-"} | PO: ${formatQty(poQty)} | NP: ${formatQty(npQty)}`;

    // Header Group per Item (Spanning 6 Kolom)
    tableBody.push([
      {
        content: `${itemTitle.toUpperCase()}   [ ${itemMeta} ]`,
        colSpan: 6,
        styles: {
          fillColor: PDF_COLORS.categoryBg,
          textColor: PDF_COLORS.categoryText,
          fontStyle: "bold",
          fontSize: 7.5,
          halign: "left",
          valign: PDF_TABLE_STYLE.valign,
          lineWidth: PDF_TABLE_STYLE.borderWidth,
          lineColor: PDF_COLORS.borderDark,
          cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
        },
      },
    ]);

    // Baris Riwayat Transaksi Item
    logs.forEach((log, logIdx) => {
      tableBody.push([
        logIdx + 1,
        formatDate(log.date),
        log.type === "Order" ? "PO" : "NP",
        log.reference || "-",
        log.vendor_name || "-",
        `${formatQty(log.qty)} ${item.unit || ""}`.trim(),
      ]);
    });
  }

  // 4. Render Satu Tabel Tunggal Menggunakan autoTable
  autoTable(doc, {
    startY: 28,
    margin: { left: portraitMarginLeft, right: portraitMarginRight, top: 14, bottom: 14 },
    theme: "plain",
    tableWidth: portraitPrintableWidth,
    styles: {
      ...PDF_TABLE_BASE_STYLES,
    },
    head: [
      [
        { content: "NO", styles: { halign: PDF_TABLE_STYLE.headerHalign, valign: PDF_TABLE_STYLE.headerValign } },
        { content: "TANGGAL", styles: { halign: PDF_TABLE_STYLE.headerHalign, valign: PDF_TABLE_STYLE.headerValign } },
        { content: "TIPE", styles: { halign: PDF_TABLE_STYLE.headerHalign, valign: PDF_TABLE_STYLE.headerValign } },
        {
          content: "NO. REFERENSI",
          styles: { halign: PDF_TABLE_STYLE.headerHalign, valign: PDF_TABLE_STYLE.headerValign },
        },
        { content: "VENDOR", styles: { halign: PDF_TABLE_STYLE.headerHalign, valign: PDF_TABLE_STYLE.headerValign } },
        { content: "VOLUME", styles: { halign: PDF_TABLE_STYLE.headerHalign, valign: PDF_TABLE_STYLE.headerValign } },
      ],
    ],
    body: tableBody,
    headStyles: {
      ...PDF_TABLE_HEAD_STYLES,
      fontSize: 7,
      cellPadding: { top: 1.8, bottom: 1.8, left: 1.5, right: 1.5 },
    },
    bodyStyles: {
      ...PDF_TABLE_BODY_STYLES,
      cellPadding: { top: 1.6, bottom: 1.6, left: 1.5, right: 1.5 },
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
      // Pastikan seluruh header selalu horizontal align center dan vertical align middle
      if (cellData.section === "head") {
        cellData.cell.styles.halign = PDF_TABLE_STYLE.headerHalign;
        cellData.cell.styles.valign = PDF_TABLE_STYLE.headerValign;
      }

      if (cellData.section === "body") {
        cellData.cell.styles.valign = PDF_TABLE_STYLE.valign;
        cellData.cell.styles.lineWidth = PDF_TABLE_STYLE.borderWidth;
        cellData.cell.styles.lineColor = PDF_COLORS.borderDark;

        if (cellData.cell.colSpan === 1 && cellData.column.index === 2) {
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
}
