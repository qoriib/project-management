import { BORDER_ACCOUNTING_TOTAL, DEFAULT_SHEET_VIEW, EXCEL_COL_WIDTH, EXCEL_NUM_FMT } from "./styles";
import { createFormalKop, renderTableHeaderRow, styleBodyRow, styleTotalRow, type SheetColumnConfig } from "./utils";
import { formatItemCode, toISODate } from "@/utils/formatters";
import { calcLine } from "@/utils/calc";
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
    header: "PEKERJAAN",
    key: "group_name",
    width: EXCEL_COL_WIDTH.category,
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
    header: "HARGA (RP)",
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
    header: "TOTAL (RP)",
    key: "total_price",
    width: EXCEL_COL_WIDTH.total,
    align: "right",
    numFmt: EXCEL_NUM_FMT.currency,
  },
];

export function createOrderSheet(workbook: ExcelJS.Workbook, context: OrderSheetContext): void {
  const { project_name, company_name, period, orderData } = context;

  const worksheet = workbook.addWorksheet("PENGADAAN", {
    views: [DEFAULT_SHEET_VIEW],
  });

  worksheet.columns = COLUMNS.map((column) => ({
    key: column.key,
    width: column.width,
  }));

  createFormalKop(worksheet, {
    endCol: "N",
    endColIdx: 14,
    startCol: "A",
    startColIdx: 1,
    subtitle: `${project_name} | ${company_name} | ${period}`,
    title: "LAPORAN PENGADAAN",
  });

  renderTableHeaderRow(worksheet, COLUMNS, 4);

  let totalOrderedQuantity = 0;
  let totalDpp = 0;
  let totalTaxAmount = 0;
  let totalOrderPrice = 0;

  // Kelompokkan data per transaksi PO (order_code) agar informasi dokumen tidak berulang
  const orderGroups = new Map<string, typeof orderData>();
  orderData.forEach((item) => {
    const key = item.order_code || "UNKNOWN";
    const group = orderGroups.get(key) || [];
    group.push(item);
    orderGroups.set(key, group);
  });

  let currentRowIndex = 5;
  let itemCounter = 1;

  for (const items of orderGroups.values()) {
    const firstItem = items[0];
    const orderDate = toISODate(firstItem.order_date);
    const orderCode = firstItem.order_code ?? "-";

    items.forEach((item, itemIndex) => {
      const row = worksheet.getRow(currentRowIndex);
      const { dpp, tax: taxAmount, total: totalPrice } = calcLine(item.qty, item.price, item.has_tax);

      totalOrderedQuantity += item.qty;
      totalDpp += dpp;
      totalTaxAmount += taxAmount;
      totalOrderPrice += totalPrice;

      const groupName = item.group_name ?? "-";
      const vendorName = item.vendor_name ?? "-";
      const itemCode = formatItemCode(item) ?? item.item_code;
      const categoryName = item.category_name ?? "-";
      const unitName = item.unit_name ?? "-";

      row.values = [
        itemCounter++,
        orderDate,
        orderCode,
        groupName,
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

      // Pisahkan antar nomor PO dengan garis double border bottom pada baris terakhir PO
      if (itemIndex === items.length - 1) {
        for (let col = 1; col <= 14; col++) {
          row.getCell(col).border = BORDER_ACCOUNTING_TOTAL;
        }
      }

      currentRowIndex++;
    });
  }

  // Baris Total
  const totalRow = worksheet.getRow(currentRowIndex);
  totalRow.values = [
    "",
    "TOTAL KESELURUHAN",
    "",
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

  worksheet.mergeCells(`B${currentRowIndex}:I${currentRowIndex}`);
  styleTotalRow(totalRow, COLUMNS);

  worksheet.autoFilter = "A4:N4";
}
