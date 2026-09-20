import jsPDF from "jspdf";
import { autoTable, type RowInput } from "jspdf-autotable";
import { ASSET_CONTROL_LOGO_BASE64 } from "./assets/asset-control-logo";
import {
  ASSET_LAYOUT,
  PDF_ASSET_REQUEST_BODY_STYLES,
  PDF_ASSET_REQUEST_COL_STYLES,
  PDF_ASSET_REQUEST_HEAD_STYLES,
  PDF_COLORS,
  PDF_FONTS,
  PDF_PAGE_PORTRAIT,
  PDF_TABLE_BASE_STYLES,
  PDF_TABLE_STYLE,
} from "./styles";
import type { AssetRequestPdfContext, AssetRequestSignature } from "./order-pdf-types";

/** Blok tanda tangan tetap (template baku Form Permintaan). */
const ASSET_REQUEST_SIGNATURES: AssetRequestSignature[] = [
  { name: "Mila", position: "Adm Logistik", role: "Diajukan Oleh," },
  { name: "Andries H Palenteng", position: "Kadiv Proyek", role: "Diperiksa Oleh," },
  { name: "Ismail Ali Usman", position: "Div. II Busdev,\nAnggaran & Pengendalian", role: "Disetujui Oleh," },
];

/** File path referensi sumber di bawah tabel sesuai blangko fisik. */
const ASSET_FOOTER_FILE_REF = "/asset/form permintaan barang.xls";

export function createAssetRequestPdf(context: AssetRequestPdfContext): jsPDF {
  const doc = new jsPDF({
    orientation: PDF_PAGE_PORTRAIT.orientation,
    unit: PDF_PAGE_PORTRAIT.unit,
    format: PDF_PAGE_PORTRAIT.format,
  });

  const { margins, pageWidth, printableWidth, kopStartY } = PDF_PAGE_PORTRAIT;

  // ============================================================
  // 1. BLOK KIRI ATAS
  // ============================================================
  let leftY = kopStartY;
  doc.setFont(PDF_FONTS.primary, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.textDark);
  doc.text(context.company_line, margins.left, leftY);

  leftY += 6;
  doc.setFont(PDF_FONTS.primary, "normal");
  doc.setFontSize(9);

  const colonLeftX = ASSET_LAYOUT.leftBlockColonX;
  const valueLeftX = ASSET_LAYOUT.leftBlockValueX;
  const valueLeftMaxW = ASSET_LAYOUT.rightBlockX - valueLeftX - 6;

  doc.text("No.", margins.left, leftY);
  doc.text(":", colonLeftX, leftY);
  leftY += 5;

  doc.text("Nama Proyek", margins.left, leftY);
  doc.text(":", colonLeftX, leftY);
  const projLines = doc.splitTextToSize(context.project_name || "-", valueLeftMaxW);
  doc.text(projLines, valueLeftX, leftY);
  leftY += projLines.length * 4.2;

  doc.text(`TA. ${context.fiscal_year}`, valueLeftX, leftY);
  leftY += 4.5;

  if (context.company_name) {
    const compLines = doc.splitTextToSize(context.company_name, valueLeftMaxW);
    doc.text(compLines, valueLeftX, leftY);
    leftY += compLines.length * 4.2;
  }

  // ============================================================
  // 2. BLOK KANAN ATAS
  // ============================================================
  let rightY = kopStartY + 6;
  const rightX = ASSET_LAYOUT.rightBlockX;
  const rightMarginX = pageWidth - margins.right;

  doc.setFont(PDF_FONTS.primary, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.textDark);

  doc.text("Kepada Yth :", rightX, rightY);
  rightY += 5;
  doc.text("Kadiv Proyek", rightX, rightY);
  rightY += 5;
  doc.text("Di_", rightX, rightY);
  doc.text("Kantor Pusat", rightMarginX, rightY + 3.5, { align: "right" });

  // ============================================================
  // 3. LOGO "ASSET CONTROL" & JUDUL DOKUMEN
  // ============================================================
  const headerSectionBottomY = Math.max(leftY, rightY + 6);
  const titleBandY = headerSectionBottomY + 4;

  const logoWidth = 42;
  const logoHeight = 12.8;
  doc.addImage(ASSET_CONTROL_LOGO_BASE64, "PNG", margins.left, titleBandY, logoWidth, logoHeight);

  const docCenterX = pageWidth / 2;
  const formTitleY = titleBandY + 5;

  doc.setFont(PDF_FONTS.primary, "bold");
  doc.setFontSize(14);
  doc.setTextColor(...PDF_COLORS.assetTitleRed);
  doc.text("FORM PERMINTAAN BARANG/ALAT", docCenterX, formTitleY, { align: "center" });

  const formTitleWidth = doc.getTextWidth("FORM PERMINTAAN BARANG/ALAT");
  doc.setLineWidth(0.4);
  doc.setDrawColor(...PDF_COLORS.assetTitleRed);
  doc.line(docCenterX - formTitleWidth / 2, formTitleY + 1.2, docCenterX + formTitleWidth / 2, formTitleY + 1.2);

  doc.setFont(PDF_FONTS.primary, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.textDark);
  doc.text(`No.   : ${context.document_code || "...................."}`, docCenterX, formTitleY + 5.5, {
    align: "center",
  });

  // ============================================================
  // 4. TABEL ITEM — No. | NAMA BARANG | KODE RAPP | SATUAN | JUMLAH | KETERANGAN
  // ============================================================
  const tableStartY = titleBandY + logoHeight + 1.5;

  const tableBody: RowInput[] = [];
  const minRows = ASSET_LAYOUT.minGridRows;
  const totalRows = Math.max(context.items.length, minRows);

  if (context.items.length > 0) {
    const firstItem = context.items[0];
    tableBody.push([
      firstItem.no,
      firstItem.name_with_price,
      firstItem.item_code ?? "",
      firstItem.unit,
      firstItem.qty_display,
      {
        content: context.remarks || "",
        rowSpan: context.items.length,
        styles: { valign: "middle" },
      },
    ]);

    for (let i = 1; i < context.items.length; i += 1) {
      const item = context.items[i];
      tableBody.push([item.no, item.name_with_price, item.item_code ?? "", item.unit, item.qty_display]);
    }

    for (let i = context.items.length; i < totalRows; i += 1) {
      tableBody.push(["", "", "", "", "", ""]);
    }
  } else {
    tableBody.push(["", "", "", "", "", context.remarks || ""]);
    for (let i = 1; i < totalRows; i += 1) {
      tableBody.push(["", "", "", "", "", ""]);
    }
  }

  autoTable(doc, {
    theme: "grid",
    startY: tableStartY,
    margin: margins,
    tableWidth: printableWidth,
    styles: {
      ...PDF_TABLE_BASE_STYLES,
      lineWidth: PDF_TABLE_STYLE.borderWidth,
      lineColor: PDF_COLORS.borderDark,
      minCellHeight: 6.2,
    },
    headStyles: PDF_ASSET_REQUEST_HEAD_STYLES,
    bodyStyles: PDF_ASSET_REQUEST_BODY_STYLES,
    columnStyles: PDF_ASSET_REQUEST_COL_STYLES,
    head: [["No.", "NAMA BARANG", "KODE RAPP", "SATUAN", "JUMLAH", "KETERANGAN"]],
    body: tableBody,
    rowPageBreak: "avoid",
    didParseCell: (cellData) => {
      if (cellData.section === "head") {
        cellData.cell.styles.halign = PDF_TABLE_STYLE.headerHalign;
        cellData.cell.styles.valign = PDF_TABLE_STYLE.headerValign;
        cellData.cell.styles.lineWidth = PDF_TABLE_STYLE.borderWidth;
        cellData.cell.styles.lineColor = PDF_COLORS.borderDark;
        cellData.cell.styles.fillColor = PDF_COLORS.assetTableOlive;
        cellData.cell.styles.textColor = PDF_COLORS.assetTableOliveText;
      }
      if (cellData.section === "body") {
        cellData.cell.styles.valign = PDF_TABLE_STYLE.valign;
        cellData.cell.styles.lineWidth = PDF_TABLE_STYLE.borderWidth;
        cellData.cell.styles.lineColor = PDF_COLORS.borderDark;
        cellData.cell.styles.fillColor = PDF_COLORS.bodyCellBg;
      }
    },
  });

  // ============================================================
  // 5. TEKS KECIL DI BAWAH TABEL (File reference)
  // ============================================================
  const afterTableY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 0;

  doc.setFont(PDF_FONTS.primary, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textDark);
  doc.text(ASSET_FOOTER_FILE_REF, margins.left, afterTableY + 4.5);

  // ============================================================
  // 6. FOOTER TANDA TANGAN
  // ============================================================
  const footerNeededHeight = 46;
  const footerBottomLimit = PDF_PAGE_PORTRAIT.pageHeight - margins.bottom;

  if (afterTableY + 10 + footerNeededHeight > footerBottomLimit) {
    doc.addPage(PDF_PAGE_PORTRAIT.format, PDF_PAGE_PORTRAIT.orientation);
  }

  const dateY = afterTableY + 10 + footerNeededHeight > footerBottomLimit ? margins.top + 4 : afterTableY + 12;

  // Tanggal & Lokasi: Rata kiri
  doc.setFont(PDF_FONTS.primary, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.textDark);
  doc.text(`${context.location}, ${context.date_display}`, margins.left + 15, dateY);

  // Tiga Blok Tanda Tangan Sejajar
  const columnWidth = printableWidth / 3;
  const roleY = dateY + 6;
  const signatureGap = 16; // Spasi fisik tanda tangan

  ASSET_REQUEST_SIGNATURES.forEach((signature, index) => {
    const colCenterX = margins.left + columnWidth * index + columnWidth / 2;

    // Baris Peran ("Diajukan Oleh,", "Diperiksa Oleh,", "Disetujui Oleh,")
    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(9);
    doc.text(signature.role, colCenterX, roleY, { align: "center" });

    // Nama Pejabat
    const nameY = roleY + signatureGap;
    doc.setFont(PDF_FONTS.primary, "bold");
    doc.setFontSize(9.5);
    doc.text(signature.name, colCenterX, nameY, { align: "center" });

    // Garis bawah nama pejabat
    const nameWidth = doc.getTextWidth(signature.name);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...PDF_COLORS.textDark);
    doc.line(colCenterX - nameWidth / 2 - 1, nameY + 0.8, colCenterX + nameWidth / 2 + 1, nameY + 0.8);

    // Jabatan Pejabat (bisa 1 atau 2 baris)
    doc.setFont(PDF_FONTS.primary, "normal");
    doc.setFontSize(8.5);
    const positionLines = signature.position.split("\n");
    positionLines.forEach((posLine, pIdx) => {
      doc.text(posLine, colCenterX, nameY + 4.5 + pIdx * 3.8, { align: "center" });
    });
  });

  return doc;
}
