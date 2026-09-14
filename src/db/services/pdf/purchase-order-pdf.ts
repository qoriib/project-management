import jsPDF from "jspdf";
import { autoTable, type RowInput } from "jspdf-autotable";
import {
  PDF_COLORS,
  PDF_FONTS,
  PDF_PAGE_PORTRAIT,
  PDF_PURCHASE_ORDER_BODY_STYLES,
  PDF_PURCHASE_ORDER_COL_STYLES,
  PDF_PURCHASE_ORDER_HEAD_STYLES,
  PDF_TABLE_BASE_STYLES,
  PDF_TABLE_STYLE,
  PO_LAYOUT,
} from "./styles";
import type { PurchaseOrderPdfContext } from "./order-pdf-types";
/** Kalimat pembuka statis di bawah header PO. */
const PO_OPENING_LINE = "Mohon kepada perusahaan saudara untuk dapat memenuhi pesanan kami sbb :";
/** Paragraf penutup statis. */
const PO_CLOSING_LINE = "Demikian P.O ini dibuat, atas perhatian dan kerja samanya diucapkan terima kasih";

export function createPurchaseOrderPdf(context: PurchaseOrderPdfContext): jsPDF {
  const isPreprinted = context.preprintedOnly !== false; // default: true (cetak pada kertas bahan form nota fisik)

  const doc = new jsPDF({
    orientation: PDF_PAGE_PORTRAIT.orientation,
    unit: PDF_PAGE_PORTRAIT.unit,
    format: PDF_PAGE_PORTRAIT.format,
  });

  const { margins, pageWidth, printableWidth, kopStartY } = PDF_PAGE_PORTRAIT;

  // ============================================================
  // 1. JUDUL "PURCHASE ORDER" (Hanya jika bukan mode blangko/nota pre-printed)
  // ============================================================
  const titleY = kopStartY;
  if (!isPreprinted) {
    doc.setFont(PDF_FONTS.primary, "bold");
    doc.setFontSize(PO_LAYOUT.titleFontSize);
    doc.setTextColor(...PDF_COLORS.textDark);

    const title = context.title || "PURCHASE ORDER";
    const titleWidth = doc.getTextWidth(title);
    const titleX = pageWidth / 2;
    doc.text(title, titleX, titleY, { align: "center" });

    doc.setLineWidth(PO_LAYOUT.titleUnderlineWidth);
    doc.setDrawColor(...PDF_COLORS.textDark);
    doc.line(titleX - titleWidth / 2, titleY + 1.2, titleX + titleWidth / 2, titleY + 1.2);
  }

  // ============================================================
  // 2. BLOK INFO HEADER (NO. PO, Tanggal, Kepada Yth)
  //    isPreprinted: hanya nilai pada x: 141mm. Mode penuh: label + colon + dotted line.
  // ============================================================
  const labelX = PO_LAYOUT.headerInfoStartX;
  const colonX = PO_LAYOUT.headerInfoColonX;
  const valueX = PO_LAYOUT.headerInfoValueX;
  const valueMaxWidth = pageWidth - margins.right - valueX;
  let infoY = titleY + 8.5;

  const renderHeaderInfoRow = (label: string, value: string): void => {
    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_COLORS.textDark);

    const lines = doc.splitTextToSize(value || "-", valueMaxWidth);

    if (!isPreprinted) {
      doc.text(label, labelX, infoY);
      doc.text(":", colonX, infoY);
      doc.text(lines, valueX, infoY);

      const lineY = infoY + 0.8;
      doc.setLineWidth(0.2);
      doc.setDrawColor(...PDF_COLORS.textDark);
      doc.setLineDashPattern([0.5, 1], 0);
      doc.line(valueX, lineY, pageWidth - margins.right, lineY);
      doc.setLineDashPattern([], 0);
    } else {
      doc.text(lines, valueX, infoY);
    }

    infoY += Math.max(5.2, lines.length * 4.2 + 1.4);
  };

  renderHeaderInfoRow("NO. PO", context.order_code);
  renderHeaderInfoRow("Tanggal", context.order_date_display);
  renderHeaderInfoRow("Kepada Yth,", context.vendor_name);

  // ============================================================
  // 3 & 4. PARAGRAF PEMBUKA, SUPIR & POLISI (Hanya jika !isPreprinted)
  // ============================================================
  let cursorY = infoY + 5;

  if (!isPreprinted) {
    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_COLORS.textDark);
    doc.text(PO_OPENING_LINE, margins.left, cursorY);

    cursorY += 6;
    const supirColonX = margins.left + 22;
    const supirLineStartX = supirColonX + 3;
    const supirLineEndX = margins.left + 85;

    doc.text("Nama Supir", margins.left, cursorY);
    doc.text(":", supirColonX, cursorY);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([0.5, 1], 0);
    doc.line(supirLineStartX, cursorY, supirLineEndX, cursorY);

    cursorY += 5.2;
    doc.text("No. Polisi", margins.left, cursorY);
    doc.text(":", supirColonX, cursorY);
    doc.line(supirLineStartX, cursorY, supirLineEndX, cursorY);
    doc.setLineDashPattern([], 0);
  }

  // ============================================================
  // 5. TABEL ITEM — NO. | NAMA BARANG | JENIS / MERK | BANYAK NYA
  //    isPreprinted: tema plain, tanpa border/header.
  //    Mode penuh: tema grid dengan header dan border lengkap.
  // ============================================================
  const tableBody: RowInput[] = [];

  for (const item of context.items) {
    tableBody.push([item.no, item.name_with_price, "", item.qty_display]);
  }

  // Catatan tambahan dirender sebagai baris-baris di kolom NAMA BARANG.
  if (context.note && context.note.trim()) {
    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(PDF_PURCHASE_ORDER_BODY_STYLES.fontSize);

    const maxColWidth = PDF_PURCHASE_ORDER_COL_STYLES[1].cellWidth - 5;

    const rawLines = context.note.split(/\r?\n/);
    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      const wrappedLines = doc.splitTextToSize(trimmed, maxColWidth);
      for (const wLine of wrappedLines) {
        if (wLine.trim()) {
          tableBody.push(["", wLine.trim(), "", ""]);
        }
      }
    }
  }

  const targetGridRows = PO_LAYOUT.minGridRows;
  while (tableBody.length < targetGridRows) {
    tableBody.push(["", "", "", ""]);
  }

  if (isPreprinted) {
    // Mode cetak blangko: startY 66mm sejajar baris data ke-1 pada kertas nota fisik.
    autoTable(doc, {
      theme: "plain",
      startY: 66,
      margin: margins,
      tableWidth: printableWidth,
      styles: {
        ...PDF_TABLE_BASE_STYLES,
        lineWidth: 0,
        lineColor: [255, 255, 255],
        minCellHeight: 6.25,
        fontSize: 8.5,
        cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
      },
      head: [],
      showHead: "never",
      body: tableBody,
      columnStyles: PDF_PURCHASE_ORDER_COL_STYLES,
      rowPageBreak: "avoid",
      didParseCell: (cellData) => {
        cellData.cell.styles.valign = "middle";
        cellData.cell.styles.lineWidth = 0;
      },
    });
  } else {
    autoTable(doc, {
      theme: "grid",
      startY: cursorY + 4,
      margin: margins,
      tableWidth: printableWidth,
      styles: {
        ...PDF_TABLE_BASE_STYLES,
        lineWidth: PDF_TABLE_STYLE.borderWidth,
        lineColor: PDF_COLORS.borderDark,
        minCellHeight: 6,
      },
      headStyles: PDF_PURCHASE_ORDER_HEAD_STYLES,
      bodyStyles: PDF_PURCHASE_ORDER_BODY_STYLES,
      columnStyles: PDF_PURCHASE_ORDER_COL_STYLES,
      head: [["NO.", "NAMA BARANG", "JENIS / MERK", "BANYAK NYA"]],
      body: tableBody,
      rowPageBreak: "avoid",
      didParseCell: (cellData) => {
        if (cellData.section === "head") {
          cellData.cell.styles.halign = PDF_TABLE_STYLE.headerHalign;
          cellData.cell.styles.valign = PDF_TABLE_STYLE.headerValign;
          cellData.cell.styles.lineWidth = PDF_TABLE_STYLE.borderWidth;
          cellData.cell.styles.lineColor = PDF_COLORS.borderDark;
          cellData.cell.styles.fillColor = PDF_COLORS.poHeaderBg;
          cellData.cell.styles.textColor = PDF_COLORS.poHeaderText;
        }
        if (cellData.section === "body") {
          cellData.cell.styles.valign = PDF_TABLE_STYLE.valign;
          cellData.cell.styles.lineWidth = PDF_TABLE_STYLE.borderWidth;
          cellData.cell.styles.lineColor = PDF_COLORS.borderDark;
          cellData.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
        }
      },
    });
  }

  // ============================================================
  // 6. FOOTER
  //    isPreprinted: hanya info proyek kiri bawah (tanpa penutup & tanda tangan).
  //    Mode penuh: footer lengkap dengan penutup & tanda tangan.
  // ============================================================
  const afterTableY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 0;

  const packageLines = doc.splitTextToSize(`Paket ${context.package_name}`, printableWidth * 0.65);
  const companyLines = doc.splitTextToSize(context.company_name, printableWidth * 0.65);

  if (isPreprinted) {
    // Posisi mengikuti softfile Excel blangko cetak (y ≈ 138mm).
    let footerY = 138;
    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_COLORS.textDark);

    doc.text(packageLines, margins.left, footerY);
    footerY += packageLines.length * 4.2 + 1.5;

    doc.text(String(context.year), margins.left, footerY);
    footerY += 5;

    doc.text(companyLines, margins.left, footerY);
  } else {
    const closingLines = doc.splitTextToSize(PO_CLOSING_LINE, printableWidth * 0.65);
    const footerTextHeight = (closingLines.length + packageLines.length + companyLines.length + 1) * 4.5;
    const totalFooterHeight = Math.max(footerTextHeight, PO_LAYOUT.signatureHeight + 10);
    const footerBottomLimit = PDF_PAGE_PORTRAIT.pageHeight - margins.bottom;

    if (afterTableY + 8 + totalFooterHeight > footerBottomLimit) {
      doc.addPage(PDF_PAGE_PORTRAIT.format, PDF_PAGE_PORTRAIT.orientation);
    }

    let footerY = afterTableY + 8 + totalFooterHeight > footerBottomLimit ? margins.top : afterTableY + 8;

    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_COLORS.textDark);

    doc.text(closingLines, margins.left, footerY);
    footerY += closingLines.length * 4.2 + 2;

    doc.text(packageLines, margins.left, footerY);
    footerY += packageLines.length * 4.2 + 1.5;

    doc.text(String(context.year), margins.left, footerY);
    footerY += 5;

    doc.text(companyLines, margins.left, footerY);

    const signX = pageWidth - margins.right - 42;
    const signY = afterTableY + 8 + totalFooterHeight > footerBottomLimit ? margins.top : afterTableY + 8;
    doc.text("Hormat kami", signX, signY);
  }

  return doc;
}
