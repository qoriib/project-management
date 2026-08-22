import type * as ExcelJS from "exceljs";
import type { ReceiptSheetContext } from "./types";
import {
  BORDER_ACCOUNTING_TOTAL,
  BORDER_ALL_LIGHT,
  createFormalKop,
  EXCEL_NUM_FMT,
  FORMAL_STYLE,
  formatToDDMMYYYY,
  renderTableHeaderRow,
  type SheetColumnConfig,
} from "./styles";
import { formatItemCode } from "@/utils/formatters";

/**
 * Creates the Goods Receipt registry sheet (Rincian Penerimaan).
 */
export function createReceiptSheet(workbook: ExcelJS.Workbook, context: ReceiptSheetContext): void {
  const { project_name, company_name, fiscal_year, period, receiptData } = context;
  const ws = workbook.addWorksheet("RINCIAN PENERIMAAN", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 5, showGridLines: true }],
  });

  const COLUMNS: SheetColumnConfig[] = [
    { header: "NO", key: "no", width: 6 },
    { header: "TANGGAL TERIMA", key: "receipt_date", width: 16 },
    { header: "NOMOR PENERIMAAN (NP)", key: "receipt_code", width: 22 },
    { header: "NOMOR PESANAN (PO)", key: "order_code", width: 20 },
    { header: "NAMA PENYEDIA / VENDOR", key: "vendor_name", width: 28 },
    { header: "KODE ITEM", key: "item_code", width: 16 },
    { header: "URAIAN BARANG / PEKERJAAN", key: "item_name", width: 36 },
    { header: "KATEGORI", key: "category_name", width: 16 },
    { header: "SATUAN", key: "unit_name", width: 10 },
    { header: "VOLUME", key: "qty", width: 18 },
  ];

  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  createFormalKop(ws, {
    company_name,
    endCol: "J",
    endColIdx: 10,
    startCol: "A",
    startColIdx: 1,
    subtitle: `Proyek: ${project_name}  |  Tahun Anggaran: ${fiscal_year}  |  Periode: ${period}`,
    title: "BUKU REGISTER PENERIMAAN BARANG (GOODS RECEIPTS / SURAT JALAN)",
  });

  renderTableHeaderRow(ws, COLUMNS, 5);

  let sumQty = 0;

  receiptData.forEach((item, index) => {
    const rowIdx = index + 6;
    const row = ws.getRow(rowIdx);

    const code = formatItemCode(item) || item.item_code || "-";
    sumQty += item.qty || 0;

    row.values = [
      index + 1,
      formatToDDMMYYYY(item.receipt_date),
      item.receipt_code || "-",
      item.order_code || "-",
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
        cell.numFmt = EXCEL_NUM_FMT.quantity;
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
      cell.numFmt = EXCEL_NUM_FMT.quantity;
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  ws.autoFilter = "A5:J5";
}
