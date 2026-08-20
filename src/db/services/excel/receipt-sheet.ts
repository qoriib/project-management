import type * as ExcelJS from "exceljs";
import type { ReceiptSheetContext } from "./types";
import { FORMAL_STYLE, BORDER_ALL_LIGHT, BORDER_ALL_THIN, BORDER_ACCOUNTING_TOTAL, createFormalKop } from "./styles";
import { formatItemCode } from "@/utils/formatters";

/**
 * Creates the Goods Receipt registry sheet (Rincian Penerimaan).
 */
export function createReceiptSheet(workbook: ExcelJS.Workbook, context: ReceiptSheetContext): void {
  const { project_name, company_name, fiscal_year, period, receiptData } = context;
  const ws = workbook.addWorksheet("RINCIAN PENERIMAAN", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 6, showGridLines: true }],
  });

  ws.columns = [
    { header: "NO", key: "no", width: 5 },
    { header: "TANGGAL TERIMA", key: "receipt_date", width: 16 },
    { header: "NOMOR PENERIMAAN (NP)", key: "receipt_code", width: 22 },
    { header: "NOMOR PESANAN (PO)", key: "order_code", width: 20 },
    { header: "NAMA PENYEDIA / VENDOR", key: "vendor_name", width: 28 },
    { header: "KODE ITEM", key: "item_code", width: 16 },
    { header: "URAIAN BARANG / PEKERJAAN", key: "item_name", width: 34 },
    { header: "KATEGORI", key: "category_name", width: 16 },
    { header: "SATUAN", key: "unit_name", width: 10 },
    { header: "VOLUME DITERIMA", key: "qty", width: 18 },
  ];

  // Kop Formal
  createFormalKop(ws, {
    startCol: "A",
    endCol: "J",
    startColIdx: 1,
    endColIdx: 10,
    company_name,
    title: "BUKU REGISTER PENERIMAAN BARANG (GOODS RECEIPTS / SURAT JALAN)",
    subtitle: `Proyek: ${project_name}  |  Tahun Anggaran: ${fiscal_year}  |  Periode: ${period}`,
  });

  ws.getRow(4).height = 6;

  // Table Headers
  const headerRow = ws.getRow(5);
  headerRow.height = 28;
  ws.columns.forEach((_, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.font = { name: FORMAL_STYLE.fontFamily, bold: true, size: 9, color: { argb: FORMAL_STYLE.tableHeaderText } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.tableHeaderBg } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = BORDER_ALL_THIN;
  });

  let sumQty = 0;

  receiptData.forEach((item, index) => {
    const rowIdx = index + 6;
    const row = ws.getRow(rowIdx);
    row.height = 20;

    const code = formatItemCode(item) || item.item_code || "-";
    sumQty += item.qty || 0;

    row.values = [
      index + 1,
      item.receipt_date,
      item.receipt_code,
      item.order_code,
      item.vendor_name || "-",
      code,
      item.item_name,
      item.category_name || "-",
      item.unit_name || "-",
      item.qty || 0,
    ];

    const isEven = index % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = BORDER_ALL_LIGHT;
      cell.font = { name: FORMAL_STYLE.fontFamily, size: 9 };
      if (isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.zebraBg } };
      }

      if (colNumber === 1 || colNumber === 2 || colNumber === 6 || colNumber === 8 || colNumber === 9) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else if (colNumber === 3 || colNumber === 4 || colNumber === 5 || colNumber === 7) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      } else if (colNumber === 10) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = "#,##0.00";
        cell.font = { name: FORMAL_STYLE.fontFamily, size: 9, bold: true };
      }
    });
  });

  // Total Row
  const totalRowIdx = receiptData.length + 6;
  const totalRow = ws.getRow(totalRowIdx);
  totalRow.height = 24;

  totalRow.values = [
    "",
    "TOTAL",
    `Total ${receiptData.length} Surat Jalan / Penerimaan`,
    "",
    "",
    "",
    "",
    "",
    "",
    sumQty,
  ];

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.border = BORDER_ACCOUNTING_TOTAL;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.totalRowBg } };
    cell.font = { name: FORMAL_STYLE.fontFamily, size: 9.5, bold: true, color: { argb: FORMAL_STYLE.totalRowText } };

    if (colNumber === 2) {
      cell.alignment = { vertical: "middle", horizontal: "center" };
    } else if (colNumber === 3) {
      cell.alignment = { vertical: "middle", horizontal: "left" };
    } else if (colNumber === 10) {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = "#,##0.00";
    }
  });

  ws.autoFilter = { from: "A5", to: "J5" };
}
