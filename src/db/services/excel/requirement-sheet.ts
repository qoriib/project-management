import {
  DEFAULT_SHEET_VIEW,
  EXCEL_COL_WIDTH,
  EXCEL_NUM_FMT,
  EXCEL_ROW_HEIGHT,
  ALIGN_CATEGORY_HEADER,
  ALIGN_LEFT,
  ALIGN_RIGHT,
  BORDER_ALL_LIGHT,
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
    endCol: "I",
    endColIdx: 9,
    startCol: "A",
    startColIdx: 1,
    subtitle: `${project_name} | ${company_name} | ${period}`,
    title: "LAPORAN KEBUTUHAN (BOQ)",
  });

  renderTableHeaderRow(worksheet, COLUMNS, 4);

  // Grouping data berdasarkan Kelompok Pekerjaan (diselaraskan urutan UUIDv7 ASC dengan aplikasi web)
  const groupMap = new Map<string, { groupId: string; groupName: string; items: typeof requirementData }>();

  requirementData.forEach((item) => {
    const groupId = item.requirement_group_id || "none";
    const groupName = (item.group_name || "").trim();
    const existing = groupMap.get(groupId) || { groupId, groupName, items: [] };
    if (!existing.groupName && groupName) existing.groupName = groupName;
    existing.items.push(item);
    groupMap.set(groupId, existing);
  });

  const sortedGroups = Array.from(groupMap.values());
  sortedGroups.sort((a, b) => a.groupId.localeCompare(b.groupId));

  let currentRowIndex = 5;
  let itemCounter = 1;

  let grandTotalQty = 0;
  let grandTotalDpp = 0;
  let grandTotalTax = 0;
  let grandTotalBudget = 0;

  for (const { groupName, items } of sortedGroups) {
    const groupBudget = items.find((item) => item.group_budget != null && item.group_budget > 0)?.group_budget ?? null;
    const isPaguGroup = (groupBudget != null && groupBudget > 0) || items.some((item) => item.is_pagu_account);

    // Jika kelompok pagu, tampilkan sebagai 1 baris saja agar sederhana untuk excel
    if (isPaguGroup) {
      const row = worksheet.getRow(currentRowIndex);
      row.height = EXCEL_ROW_HEIGHT.bodyRow;
      const effectivePaguBudget = groupBudget ?? items[0]?.total_price ?? 0;
      const paguName = items[0]?.item_name || groupName;

      row.values = [
        itemCounter++,
        "PAGU",
        paguName,
        "-",
        "-",
        "-",
        "-",
        "-",
        effectivePaguBudget > 0 ? effectivePaguBudget : "-",
      ];
      styleBodyRow(row, COLUMNS);
      currentRowIndex++;

      grandTotalBudget += effectivePaguBudget;
      continue;
    }

    // 1. Render Baris Header Kelompok Pekerjaan (tanpa prefix "PEKERJAAN: ")
    const headerRow = worksheet.getRow(currentRowIndex);
    headerRow.height = EXCEL_ROW_HEIGHT.categoryHeader;
    worksheet.mergeCells(`A${currentRowIndex}:I${currentRowIndex}`);
    const firstCell = worksheet.getCell(`A${currentRowIndex}`);
    firstCell.value = groupName.toUpperCase();
    firstCell.font = FONT_CATEGORY_HEADER;
    firstCell.alignment = ALIGN_CATEGORY_HEADER;

    for (let c = 1; c <= 9; c++) {
      const cell = headerRow.getCell(c);
      cell.border = BORDER_ALL_LIGHT;
    }
    currentRowIndex++;

    const isSingleEmpty = items.length === 1 && Boolean(items[0].is_empty_group);

    // Jika kelompok kosong biasa, tampilkan baris keterangan (empty state) lalu selalu tampilkan subtotal
    if (isSingleEmpty) {
      const row = worksheet.getRow(currentRowIndex);
      row.height = EXCEL_ROW_HEIGHT.bodyRow;
      row.values = ["", "-", "(Belum ada rincian item)", "-", "-", "-", "-", "-", "-"];
      styleBodyRow(row, COLUMNS);
      currentRowIndex++;

      // Baris Subtotal untuk kelompok kosong (selalu tampil)
      const subtotalRow = worksheet.getRow(currentRowIndex);
      subtotalRow.height = EXCEL_ROW_HEIGHT.bodyRow;
      subtotalRow.values = ["", `SUBTOTAL ${groupName.toUpperCase()}`, "", "", "-", "", "-", "-", "-"];
      worksheet.mergeCells(`B${currentRowIndex}:D${currentRowIndex}`);

      subtotalRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.font = FONT_BOLD;
        cell.border = BORDER_ALL_LIGHT;

        if (colNum === 2) {
          cell.alignment = ALIGN_LEFT;
        } else if (colNum === 5) {
          cell.alignment = ALIGN_RIGHT;
        } else if (colNum === 7 || colNum === 8 || colNum === 9) {
          if (typeof cell.value === "number") cell.numFmt = EXCEL_NUM_FMT.currency;
          cell.alignment = ALIGN_RIGHT;
        }
      });
      currentRowIndex++;
      continue;
    }

    // 2. Render item material biasa di bawah kelompok pekerjaan
    let subtotalQty = 0;
    let subtotalDpp = 0;
    let subtotalTax = 0;
    let subtotalBudget = 0;

    for (const item of items) {
      const row = worksheet.getRow(currentRowIndex);
      row.height = EXCEL_ROW_HEIGHT.bodyRow;

      const itemCode = formatItemCode(item) || item.item_code || "-";
      const unitName = item.unit_name || "-";
      const taxDisplay = item.has_tax && item.tax_amount > 0 ? item.tax_amount : "-";

      subtotalQty += item.qty;
      subtotalDpp += item.dpp;
      subtotalTax += item.tax_amount;
      subtotalBudget += item.total_price;

      row.values = [
        itemCounter++,
        itemCode,
        item.item_name,
        unitName,
        item.qty,
        item.price,
        item.dpp,
        taxDisplay,
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
      subtotalQty,
      "",
      subtotalDpp,
      subtotalTax > 0 ? subtotalTax : "-",
      subtotalBudget,
    ];
    worksheet.mergeCells(`B${currentRowIndex}:D${currentRowIndex}`);

    subtotalRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.font = FONT_BOLD;
      cell.border = BORDER_ALL_LIGHT;

      if (colNum === 2) {
        cell.alignment = ALIGN_LEFT;
      } else if (colNum === 5) {
        cell.numFmt = EXCEL_NUM_FMT.quantity;
        cell.alignment = ALIGN_RIGHT;
      } else if (colNum === 7 || colNum === 8 || colNum === 9) {
        if (typeof cell.value === "number") cell.numFmt = EXCEL_NUM_FMT.currency;
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
    grandTotalQty,
    "",
    grandTotalDpp,
    grandTotalTax,
    grandTotalBudget,
  ];

  worksheet.mergeCells(`B${currentRowIndex}:D${currentRowIndex}`);
  styleTotalRow(totalRow, COLUMNS);

  worksheet.autoFilter = "A4:I4";
}
