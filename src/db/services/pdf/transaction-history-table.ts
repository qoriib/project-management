import autoTable, { type RowInput } from "jspdf-autotable";
import { formatItemCode } from "@/utils/formatters";
import {
  PDF_COLORS,
  PDF_FONTS,
  PDF_PAGE_PORTRAIT,
  PDF_TABLE_BASE_STYLES,
  PDF_TABLE_HISTORY_BANNER_STYLES,
  PDF_TABLE_STYLE,
  PDF_TRANSACTION_HISTORY_BODY_STYLES,
  PDF_TRANSACTION_HISTORY_COL_STYLES,
  PDF_TRANSACTION_HISTORY_HEAD_STYLES,
} from "./styles";
import { formatDate, formatQty, renderPdfKop } from "./utils";
import type { TransactionHistoryPdfContext } from "./types";
import type jsPDF from "jspdf";

export function renderTransactionHistorySection(doc: jsPDF, context: TransactionHistoryPdfContext): void {
  const { project_name: projectName, company_name: companyName, period, itemLogs } = context;

  // Tambah Halaman Baru Format Potret
  doc.addPage(PDF_PAGE_PORTRAIT.format, PDF_PAGE_PORTRAIT.orientation);

  // Render Kop Formal Bagian Riwayat Transaksi
  renderPdfKop(doc, {
    title: "RIWAYAT TRANSAKSI",
    projectName,
    companyName,
    period,
    pageWidth: PDF_PAGE_PORTRAIT.pageWidth,
    startY: PDF_PAGE_PORTRAIT.kopStartY,
  });

  const validItemLogs = (itemLogs || []).filter((entry) => entry.logs && entry.logs.length > 0);

  if (validItemLogs.length === 0) {
    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text("Tidak ada riwayat transaksi pada item untuk periode ini.", PDF_PAGE_PORTRAIT.pageWidth / 2, 40, {
      align: "center",
    });
    return;
  }

  // Bangun Baris Body untuk Satu Tabel Terpadu
  const tableBody: RowInput[] = [];

  for (const { item, logs } of validItemLogs) {
    const itemCode = formatItemCode(item);
    const itemTitle = `${itemCode} | ${item.item_name}`;

    // Header Group per Item (Spanning 6 Kolom)
    tableBody.push([
      {
        content: itemTitle.toUpperCase(),
        colSpan: 6,
        styles: PDF_TABLE_HISTORY_BANNER_STYLES,
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
        formatQty(log.qty),
      ]);
    });
  }

  // Render Satu Tabel Tunggal Menggunakan autoTable
  autoTable(doc, {
    theme: "plain",
    startY: PDF_PAGE_PORTRAIT.tableStartY,
    margin: PDF_PAGE_PORTRAIT.margins,
    tableWidth: PDF_PAGE_PORTRAIT.printableWidth,
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
    headStyles: PDF_TRANSACTION_HISTORY_HEAD_STYLES,
    bodyStyles: PDF_TRANSACTION_HISTORY_BODY_STYLES,
    columnStyles: PDF_TRANSACTION_HISTORY_COL_STYLES,
    didParseCell: (cellData) => {
      if (cellData.section === "head") {
        cellData.cell.styles.halign = PDF_TABLE_STYLE.headerHalign;
        cellData.cell.styles.valign = PDF_TABLE_STYLE.headerValign;
      }

      if (cellData.section === "body") {
        cellData.cell.styles.valign = PDF_TABLE_STYLE.valign;
        cellData.cell.styles.lineWidth = PDF_TABLE_STYLE.borderWidth;
        cellData.cell.styles.lineColor = PDF_COLORS.borderDark;
      }
    },
  });
}
