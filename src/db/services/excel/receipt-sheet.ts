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
    views: [{ state: "frozen", xSplit: 0, ySplit: 5, showGridLines: true }],
  });

  const COLUMNS = [
    { header: "NO", key: "no", width: 6 },
    { header: "TANGGAL TERIMA", key: "receipt_date", width: 16 },
    { header: "NOMOR PENERIMAAN (NP)", key: "receipt_code", width: 22 },
    { header: "NOMOR PESANAN (PO)", key: "order_code", width: 20 },
    { header: "NAMA PENYEDIA / VENDOR", key: "vendor_name", width: 28 },
    { header: "KODE ITEM", key: "item_code", width: 16 },
    { header: "URAIAN BARANG / PEKERJAAN", key: "item_name", width: 36 },
    { header: "KATEGORI", key: "category_name", width: 16 },
    { header: "SATUAN", key: "unit_name", width: 10 },
    { header: "Volume", key: "qty", width: 18 },
  ];

  // Set column keys and widths
  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  // Kop Formal
  createFormalKop(ws, {
    company_name,
    endCol: "J",
    endColIdx: 10,
    startCol: "A",
    startColIdx: 1,
    subtitle: `Proyek: ${project_name}  |  Tahun Anggaran: ${fiscal_year}  |  Periode: ${period}`,
    title: "BUKU REGISTER PENERIMAAN BARANG (GOODS RECEIPTS / SURAT JALAN)",
  });

  // Table Headers at Row 5
  const headerRow = ws.getRow(5);
  COLUMNS.forEach((col, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: FORMAL_STYLE.tableHeaderText }, name: FORMAL_STYLE.fontFamily, size: 9 };
    cell.fill = { fgColor: { argb: FORMAL_STYLE.tableHeaderBg }, pattern: "solid", type: "pattern" };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = BORDER_ALL_THIN;
  });

  let sumQty = 0;

  receiptData.forEach((item, index) => {
    const rowIdx = index + 6;
    const row = ws.getRow(rowIdx);

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
        cell.fill = { fgColor: { argb: FORMAL_STYLE.zebraBg }, pattern: "solid", type: "pattern" };
      }

      if (colNumber === 1 || colNumber === 2 || colNumber === 6 || colNumber === 8 || colNumber === 9) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 3 || colNumber === 4 || colNumber === 5 || colNumber === 7) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }

      if (colNumber === 10) {
        cell.numFmt = "#,##0.00;(#,##0.00);-";
      }
    });
  });

  // Total Row
  const totalRowIdx = receiptData.length + 6;
  const totalRow = ws.getRow(totalRowIdx);
  totalRow.values = ["", "TOTAL PENERIMAAN", "", "", "", "", "", "", "", sumQty];

  ws.mergeCells(`B${totalRowIdx}:I${totalRowIdx}`);

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true, color: { argb: FORMAL_STYLE.totalRowText }, name: FORMAL_STYLE.fontFamily, size: 9 };
    cell.fill = { fgColor: { argb: FORMAL_STYLE.totalRowBg }, pattern: "solid", type: "pattern" };
    cell.border = BORDER_ACCOUNTING_TOTAL;

    if (colNumber === 2) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    } else if (colNumber === 10) {
      cell.numFmt = "#,##0.00;(#,##0.00);-";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  ws.autoFilter = "A5:J5";
}
