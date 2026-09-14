import {
  DEFAULT_SHEET_VIEW,
  EXCEL_COL_WIDTH,
  EXCEL_NUM_FMT,
  EXCEL_ROW_HEIGHT,
  ALIGN_CATEGORY_HEADER,
  ALIGN_LEFT,
  ALIGN_RIGHT,
  BORDER_ALL_LIGHT,
  FILL_SECONDARY_HEADER,
  FILL_TOTAL_ROW,
  FONT_BOLD,
  FONT_CATEGORY_HEADER,
} from "./styles";
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
    header: "PEKERJAAN",
    key: "group_name",
    width: EXCEL_COL_WIDTH.category,
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
    endCol: "K",
    endColIdx: 11,
    startCol: "A",
    startColIdx: 1,
    subtitle: `${project_name} | ${company_name} | ${period}`,
    title: "LAPORAN KEBUTUHAN (BOQ)",
  });

  renderTableHeaderRow(worksheet, COLUMNS, 4);

  // Grouping data berdasarkan Kelompok Pekerjaan
  const groupMap = new Map<string, typeof requirementData>();
  requirementData.forEach((item) => {
    const groupName = (item.group_name || "").trim();
    const list = groupMap.get(groupName) || [];
    list.push(item);
    groupMap.set(groupName, list);
  });

  const sortedGroups = Array.from(groupMap.entries());
  sortedGroups.sort(([a], [b]) => a.localeCompare(b));

  let currentRowIndex = 5;
  let itemCounter = 1;

  let grandTotalQty = 0;
  let grandTotalDpp = 0;
  let grandTotalTax = 0;
  let grandTotalBudget = 0;

  for (const [groupName, items] of sortedGroups) {
    // 1. Render Baris Header Kelompok Pekerjaan
    const headerRow = worksheet.getRow(currentRowIndex);
    headerRow.height = EXCEL_ROW_HEIGHT.categoryHeader;
    worksheet.mergeCells(`A${currentRowIndex}:K${currentRowIndex}`);
    const firstCell = worksheet.getCell(`A${currentRowIndex}`);
    firstCell.value = `PEKERJAAN: ${groupName.toUpperCase()}`;
    firstCell.font = FONT_CATEGORY_HEADER;
    firstCell.alignment = ALIGN_CATEGORY_HEADER;

    for (let c = 1; c <= 11; c++) {
      const cell = headerRow.getCell(c);
      cell.fill = FILL_SECONDARY_HEADER;
      cell.border = BORDER_ALL_LIGHT;
    }
    currentRowIndex++;

    // 2. Render item material di bawah kelompok pekerjaan
    let subtotalQty = 0;
    let subtotalDpp = 0;
    let subtotalTax = 0;
    let subtotalBudget = 0;

    for (const item of items) {
      const row = worksheet.getRow(currentRowIndex);
      row.height = EXCEL_ROW_HEIGHT.bodyRow;

      const itemCode = formatItemCode(item) ?? item.item_code;
      const categoryName = item.category_name ?? "-";
      const unitName = item.unit_name ?? "-";

      subtotalQty += item.qty;
      subtotalDpp += item.dpp;
      subtotalTax += item.tax_amount;
      subtotalBudget += item.total_price;

      row.values = [
        itemCounter++,
        groupName,
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
      currentRowIndex++;
    }

    grandTotalQty += subtotalQty;
    grandTotalDpp += subtotalDpp;
    grandTotalTax += subtotalTax;
    grandTotalBudget += subtotalBudget;

    // 3. Render Baris Subtotal per Kelompok Pekerjaan
    const subtotalRow = worksheet.getRow(currentRowIndex);
    subtotalRow.height = EXCEL_ROW_HEIGHT.bodyRow;
    subtotalRow.values = [
      "",
      `SUBTOTAL ${groupName.toUpperCase()}`,
      "",
      "",
      "",
      "",
      subtotalQty,
      "",
      subtotalDpp,
      subtotalTax,
      subtotalBudget,
    ];
    worksheet.mergeCells(`B${currentRowIndex}:F${currentRowIndex}`);

    subtotalRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.font = FONT_BOLD;
      cell.fill = FILL_TOTAL_ROW;
      cell.border = BORDER_ALL_LIGHT;

      if (colNum === 2) {
        cell.alignment = ALIGN_LEFT;
      } else if (colNum === 7) {
        cell.numFmt = EXCEL_NUM_FMT.quantity;
        cell.alignment = ALIGN_RIGHT;
      } else if (colNum === 9 || colNum === 10 || colNum === 11) {
        cell.numFmt = EXCEL_NUM_FMT.currency;
        cell.alignment = ALIGN_RIGHT;
      }
    });

    currentRowIndex++;
  }

  // 4. Baris Total Keseluruhan
  const totalRow = worksheet.getRow(currentRowIndex);
  totalRow.height = EXCEL_ROW_HEIGHT.bodyRow;
  totalRow.values = [
    "",
    "TOTAL KESELURUHAN",
    "",
    "",
    "",
    "",
    grandTotalQty,
    "",
    grandTotalDpp,
    grandTotalTax,
    grandTotalBudget,
  ];

  worksheet.mergeCells(`B${currentRowIndex}:F${currentRowIndex}`);
  styleTotalRow(totalRow, COLUMNS);

  worksheet.autoFilter = "A4:K4";
}
