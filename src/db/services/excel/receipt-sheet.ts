import { DEFAULT_SHEET_VIEW, EXCEL_COL_WIDTH, EXCEL_NUM_FMT } from "./styles";
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
    title: "RINCIAN PENERIMAAN",
  });

  renderTableHeaderRow(worksheet, COLUMNS, 4);

  let totalReceivedQuantity = 0;

  receiptData.forEach((item, index) => {
    const rowNumber = index + 5;
    const row = worksheet.getRow(rowNumber);

    const receiptDate = toISODate(item.receipt_date);
    const receiptCode = item.receipt_code ?? "-";
    const orderCode = item.order_code ?? "-";
    const vendorName = item.vendor_name ?? "-";
    const itemCode = formatItemCode(item) ?? item.item_code;
    const categoryName = item.category_name ?? "-";
    const unitName = item.unit_name ?? "-";

    totalReceivedQuantity += item.qty;

    row.values = [
      index + 1,
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
  });

  // Baris Total
  const totalRowIndex = receiptData.length + 5;
  const totalRow = worksheet.getRow(totalRowIndex);
  totalRow.values = ["", "TOTAL", "", "", "", "", "", "", "", totalReceivedQuantity];

  worksheet.mergeCells(`B${totalRowIndex}:I${totalRowIndex}`);
  styleTotalRow(totalRow, COLUMNS);

  worksheet.autoFilter = "A4:J4";
}
