import { DEFAULT_SHEET_VIEW, EXCEL_COL_WIDTH, EXCEL_NUM_FMT } from "./styles";
import { createFormalKop, renderTableHeaderRow, styleBodyRow, styleTotalRow, type SheetColumnConfig } from "./utils";
import { formatItemCode, toISODate } from "@/utils/formatters";
import { calcDPP, calcTax } from "@/utils/calc";
import type { OrderSheetContext } from "./types";
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
    key: "order_date",
    width: EXCEL_COL_WIDTH.date,
    align: "center",
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
  {
    header: "HARGA SATUAN (RP)",
    key: "price",
    width: EXCEL_COL_WIDTH.price,
    align: "right",
    numFmt: EXCEL_NUM_FMT.currency,
  },
  {
    header: "SUBTOTAL (RP)",
    key: "dpp",
    width: EXCEL_COL_WIDTH.subtotal,
    align: "right",
    numFmt: EXCEL_NUM_FMT.currency,
  },
  {
    header: "PPN 12% (RP)",
    key: "tax_amount",
    width: EXCEL_COL_WIDTH.tax,
    align: "right",
    numFmt: EXCEL_NUM_FMT.currency,
  },
  {
    header: "TOTAL HARGA (RP)",
    key: "total_price",
    width: EXCEL_COL_WIDTH.total,
    align: "right",
    numFmt: EXCEL_NUM_FMT.currency,
  },
];

export function createOrderSheet(workbook: ExcelJS.Workbook, context: OrderSheetContext): void {
  const { project_name, company_name, period, orderData } = context;

  const worksheet = workbook.addWorksheet("PEMESANAN", {
    views: [DEFAULT_SHEET_VIEW],
  });

  worksheet.columns = COLUMNS.map((column) => ({
    key: column.key,
    width: column.width,
  }));

  createFormalKop(worksheet, {
    endCol: "M",
    endColIdx: 13,
    startCol: "A",
    startColIdx: 1,
    subtitle: `${project_name} | ${company_name} | ${period}`,
    title: "RINCIAN PEMESANAN",
  });

  renderTableHeaderRow(worksheet, COLUMNS, 4);

  let totalOrderedQuantity = 0;
  let totalDpp = 0;
  let totalTaxAmount = 0;
  let totalOrderPrice = 0;

  orderData.forEach((item, index) => {
    const rowNumber = index + 5;
    const row = worksheet.getRow(rowNumber);

    const dpp = calcDPP(item.qty, item.price);
    const taxAmount = calcTax(dpp, item.has_tax);
    const totalPrice = dpp + taxAmount;

    totalOrderedQuantity += item.qty;
    totalDpp += dpp;
    totalTaxAmount += taxAmount;
    totalOrderPrice += totalPrice;

    const orderDate = toISODate(item.order_date);
    const orderCode = item.order_code ?? "-";
    const vendorName = item.vendor_name ?? "-";
    const itemCode = formatItemCode(item) ?? item.item_code;
    const categoryName = item.category_name ?? "-";
    const unitName = item.unit_name ?? "-";

    row.values = [
      index + 1,
      orderDate,
      orderCode,
      vendorName,
      itemCode,
      item.item_name,
      categoryName,
      unitName,
      item.qty,
      item.price,
      dpp,
      taxAmount,
      totalPrice,
    ];

    styleBodyRow(row, COLUMNS);
  });

  // Baris Total
  const totalRowIndex = orderData.length + 5;
  const totalRow = worksheet.getRow(totalRowIndex);
  totalRow.values = [
    "",
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    "",
    totalOrderedQuantity,
    "",
    totalDpp,
    totalTaxAmount,
    totalOrderPrice,
  ];

  worksheet.mergeCells(`B${totalRowIndex}:H${totalRowIndex}`);
  styleTotalRow(totalRow, COLUMNS);

  worksheet.autoFilter = "A4:M4";
}
