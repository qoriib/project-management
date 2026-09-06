import { DEFAULT_SHEET_VIEW, EXCEL_COL_WIDTH, EXCEL_NUM_FMT } from "./styles";
import { createFormalKop, renderTableHeaderRow, styleBodyRow, styleTotalRow, type SheetColumnConfig } from "./utils";
import { formatItemCode } from "@/utils/formatters";
import type { RequirementSheetContext } from "./types";
import type * as ExcelJS from "exceljs";

const COLUMNS: SheetColumnConfig[] = [
  {
    header: "NO",
    key: "no",
    width: EXCEL_COL_WIDTH.no,
    align: "center",
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
    header: "TOTAL ANGGARAN (RP)",
    key: "total_price",
    width: EXCEL_COL_WIDTH.total,
    align: "right",
    numFmt: EXCEL_NUM_FMT.currency,
  },
];

export function createRequirementSheet(workbook: ExcelJS.Workbook, context: RequirementSheetContext): void {
  const { project_name, company_name, period, requirementData } = context;

  const worksheet = workbook.addWorksheet("KEBUTUHAN", {
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
    title: "LAPORAN KEBUTUHAN",
  });

  renderTableHeaderRow(worksheet, COLUMNS, 4);

  let totalQuantity = 0;
  let totalDpp = 0;
  let totalTaxAmount = 0;
  let totalBudget = 0;

  requirementData.forEach((item, index) => {
    const rowNumber = index + 5;
    const row = worksheet.getRow(rowNumber);

    const itemCode = formatItemCode(item) ?? item.item_code;
    const categoryName = item.category_name ?? "-";
    const unitName = item.unit_name ?? "-";

    totalQuantity += item.qty;
    totalDpp += item.dpp;
    totalTaxAmount += item.tax_amount;
    totalBudget += item.total_price;

    row.values = [
      index + 1,
      itemCode,
      item.item_name,
      categoryName,
      unitName,
      item.qty,
      item.price,
      item.dpp,
      item.tax_amount,
      item.total_price,
    ];

    styleBodyRow(row, COLUMNS);
  });

  // Baris Total
  const totalRowIndex = requirementData.length + 5;
  const totalRow = worksheet.getRow(totalRowIndex);
  totalRow.values = ["", "TOTAL", "", "", "", totalQuantity, "", totalDpp, totalTaxAmount, totalBudget];

  worksheet.mergeCells(`B${totalRowIndex}:E${totalRowIndex}`);
  styleTotalRow(totalRow, COLUMNS);

  worksheet.autoFilter = "A4:J4";
}
