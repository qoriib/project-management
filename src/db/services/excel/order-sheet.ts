import type * as ExcelJS from "exceljs";
import type { OrderSheetContext } from "./types";
import { FORMAL_STYLE, BORDER_ALL_LIGHT, BORDER_ALL_THIN, BORDER_ACCOUNTING_TOTAL, createFormalKop } from "./styles";
import { formatItemCode } from "@/utils/formatters";

/**
 * Creates the Purchase Orders registry sheet (Rincian Pesanan).
 */
export function createOrderSheet(workbook: ExcelJS.Workbook, context: OrderSheetContext): void {
  const { project_name, company_name, fiscal_year, period, orderData } = context;
  const ws = workbook.addWorksheet("RINCIAN PESANAN", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 6, showGridLines: true }],
  });

  ws.columns = [
    { header: "NO", key: "no", width: 5 },
    { header: "TANGGAL PESANAN", key: "order_date", width: 16 },
    { header: "NOMOR ORDER (PO)", key: "order_code", width: 18 },
    { header: "NAMA PENYEDIA / VENDOR", key: "vendor_name", width: 28 },
    { header: "KODE ITEM", key: "item_code", width: 16 },
    { header: "URAIAN BARANG / PEKERJAAN", key: "item_name", width: 34 },
    { header: "KATEGORI", key: "category_name", width: 16 },
    { header: "SATUAN", key: "unit_name", width: 10 },
    { header: "VOLUME", key: "qty", width: 14 },
    { header: "HARGA SATUAN (RP)", key: "price", width: 18 },
    { header: "STATUS PAJAK", key: "tax_status", width: 14 },
    { header: "TOTAL HARGA (RP)", key: "total_price", width: 22 },
  ];

  // Kop Formal
  createFormalKop(ws, {
    startCol: "A",
    endCol: "L",
    startColIdx: 1,
    endColIdx: 12,
    company_name,
    title: "BUKU REGISTER PEMESANAN BARANG (PURCHASE ORDERS)",
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
  let sumTotalPrice = 0;

  orderData.forEach((item, index) => {
    const rowIdx = index + 6;
    const row = ws.getRow(rowIdx);
    row.height = 20;

    const code = formatItemCode(item) || item.item_code || "-";
    const taxStatus = item.has_tax === 1 ? "PPn 12%" : "Non-PPn";

    sumQty += item.qty || 0;
    sumTotalPrice += item.total_price || 0;

    row.values = [
      index + 1,
      item.order_date,
      item.order_code,
      item.vendor_name || "-",
      code,
      item.item_name,
      item.category_name || "-",
      item.unit_name || "-",
      item.qty || 0,
      item.price || 0,
      taxStatus,
      item.total_price || 0,
    ];

    const isEven = index % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = BORDER_ALL_LIGHT;
      cell.font = { name: FORMAL_STYLE.fontFamily, size: 9 };
      if (isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.zebraBg } };
      }

      if (
        colNumber === 1 ||
        colNumber === 2 ||
        colNumber === 5 ||
        colNumber === 7 ||
        colNumber === 8 ||
        colNumber === 11
      ) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else if (colNumber === 3 || colNumber === 4 || colNumber === 6) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      } else if (colNumber === 9) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = "#,##0.00";
      } else if (colNumber === 10 || colNumber === 12) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = "#,##0";
        if (colNumber === 12) {
          cell.font = { name: FORMAL_STYLE.fontFamily, size: 9, bold: true };
        }
      }
    });
  });

  // Total Row
  const totalRowIdx = orderData.length + 6;
  const totalRow = ws.getRow(totalRowIdx);
  totalRow.height = 24;

  totalRow.values = [
    "",
    "TOTAL",
    `Total ${orderData.length} Baris Transaksi`,
    "",
    "",
    "",
    "",
    "",
    sumQty,
    "",
    "",
    sumTotalPrice,
  ];

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.border = BORDER_ACCOUNTING_TOTAL;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.totalRowBg } };
    cell.font = { name: FORMAL_STYLE.fontFamily, size: 9.5, bold: true, color: { argb: FORMAL_STYLE.totalRowText } };

    if (colNumber === 2) {
      cell.alignment = { vertical: "middle", horizontal: "center" };
    } else if (colNumber === 3) {
      cell.alignment = { vertical: "middle", horizontal: "left" };
    } else if (colNumber === 9) {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = "#,##0.00";
    } else if (colNumber === 12) {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = "#,##0";
    }
  });

  ws.autoFilter = { from: "A5", to: "L5" };
}
