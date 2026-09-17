import { BORDER_ACCOUNTING_TOTAL, DEFAULT_SHEET_VIEW, EXCEL_COL_WIDTH, EXCEL_NUM_FMT } from "./styles";
import { createFormalKop, renderTableHeaderRow, styleBodyRow, styleTotalRow, type SheetColumnConfig } from "./utils";
import { formatItemCode, toISODate } from "@/utils/formatters";
import type { ReceiptSheetContext } from "./types";
import type * as ExcelJS from "exceljs";

const COLUMNS: SheetColumnConfig[] = [
  {
    header: "NO",
    key: "no",
    width: EXCEL_COL_WIDTH.no,
    align: "center",
  },
  {
    header: "TANGGAL",
    key: "receipt_date",
    width: EXCEL_COL_WIDTH.date,
    align: "center",
  },
  {
    header: "NO. NP",
    key: "receipt_code",
    width: EXCEL_COL_WIDTH.receiptCode,
    align: "left",
  },
  {
    header: "NO. PO",
    key: "order_code",
    width: EXCEL_COL_WIDTH.orderCode,
    align: "left",
  },
  {
    header: "VENDOR",
    key: "vendor_name",
    width: EXCEL_COL_WIDTH.vendor,
    align: "left",
  },
  {
    header: "KODE ITEM",
    key: "item_code",
    width: EXCEL_COL_WIDTH.itemCode,
    align: "center",
  },
  {
    header: "NAMA ITEM",
    key: "item_name",
    width: EXCEL_COL_WIDTH.itemName,
    align: "left",
  },
  {
    header: "KATEGORI",
    key: "category_name",
    width: EXCEL_COL_WIDTH.category,
    align: "center",
  },
  {
    header: "SATUAN",
    key: "unit_name",
    width: EXCEL_COL_WIDTH.unit,
    align: "center",
  },
  {
    header: "VOLUME",
    key: "qty",
    width: EXCEL_COL_WIDTH.qty,
    align: "right",
    numFmt: EXCEL_NUM_FMT.quantity,
  },
];

export function createReceiptSheet(workbook: ExcelJS.Workbook, context: ReceiptSheetContext): void {
  const { project_name, company_name, period, receiptData } = context;

  const worksheet = workbook.addWorksheet("PENERIMAAN", {
    views: [DEFAULT_SHEET_VIEW],
  });

  worksheet.columns = COLUMNS.map((column) => ({
    key: column.key,
    width: column.width,
  }));

  createFormalKop(worksheet, {
    endCol: "J",
    endColIdx: 10,
    startCol: "A",
    startColIdx: 1,
    subtitle: `${project_name} | ${company_name} | ${period}`,
    title: "LAPORAN PENERIMAAN",
  });

  renderTableHeaderRow(worksheet, COLUMNS, 4);

  let totalReceivedQuantity = 0;

  // Kelompokkan data per transaksi NP (receipt_code)
  const receiptGroups = new Map<string, typeof receiptData>();
  receiptData.forEach((item) => {
    const key = item.receipt_code || "UNKNOWN";
    const group = receiptGroups.get(key) || [];
    group.push(item);
    receiptGroups.set(key, group);
  });

  let currentRowIndex = 5;
  let itemCounter = 1;

  for (const items of receiptGroups.values()) {
    const firstItem = items[0];
    const receiptDate = toISODate(firstItem.receipt_date);
    const receiptCode = firstItem.receipt_code ?? "-";

    items.forEach((item, itemIndex) => {
      const row = worksheet.getRow(currentRowIndex);
      const orderCode = item.order_code ?? "-";
      const vendorName = item.vendor_name ?? "-";
      const itemCode = formatItemCode(item) ?? item.item_code;
      const categoryName = item.category_name ?? "-";
      const unitName = item.unit_name ?? "-";

      totalReceivedQuantity += item.qty;

      row.values = [
        itemCounter++,
        receiptDate,
        receiptCode,
        orderCode,
        vendorName,
        itemCode,
        item.item_name,
        categoryName,
        unitName,
        item.qty,
      ];

      styleBodyRow(row, COLUMNS);

      // Pisahkan antar nomor NP dengan garis double border bottom pada baris terakhir NP
      if (itemIndex === items.length - 1) {
        for (let col = 1; col <= 10; col++) {
          row.getCell(col).border = BORDER_ACCOUNTING_TOTAL;
        }
      }

      currentRowIndex++;
    });
  }

  // Baris Total
  const totalRow = worksheet.getRow(currentRowIndex);
  totalRow.values = ["", "TOTAL KESELURUHAN", "", "", "", "", "", "", "", totalReceivedQuantity];

  worksheet.mergeCells(`B${currentRowIndex}:I${currentRowIndex}`);
  styleTotalRow(totalRow, COLUMNS);

  worksheet.autoFilter = "A4:J4";
}
