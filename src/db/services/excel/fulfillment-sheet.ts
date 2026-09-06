import type * as ExcelJS from "exceljs";
import type { FulfillmentSheetContext } from "./types";
import { calcRatio, calcVariance } from "@/utils/calc";
import {
  ALIGN_CATEGORY_HEADER,
  ALIGN_CENTER,
  ALIGN_HEADER,
  ALIGN_LEFT,
  ALIGN_RIGHT,
  BORDER_ACCOUNTING_TOTAL,
  BORDER_ALL_LIGHT,
  EXCEL_COL_WIDTH,
  EXCEL_NUM_FMT,
  EXCEL_ROW_HEIGHT,
  FILL_BUDGET_OVER_CELL,
  FILL_SECONDARY_HEADER,
  FILL_TABLE_HEADER,
  FILL_TOTAL_ROW,
  FILL_UNPLANNED_CELL,
  FILL_WHITE,
  FONT_CATEGORY_HEADER,
  FONT_REGULAR,
  FONT_TABLE_HEADER,
  FONT_TOTAL_ROW,
  FULFILLMENT_SHEET_VIEW,
} from "./styles";
import { createFormalKop, type SheetColumnConfig } from "./utils";
import { formatItemCode } from "@/utils/formatters";

export function createFulfillmentSheet(workbook: ExcelJS.Workbook, context: FulfillmentSheetContext): void {
  const { project_name, company_name, period, data: fulfillmentItems } = context;

  const worksheet = workbook.addWorksheet("PEMENUHAN", {
    views: [FULFILLMENT_SHEET_VIEW],
  });

  const COLUMNS: SheetColumnConfig[] = [
    {
      header: "NO",
      key: "no",
      width: EXCEL_COL_WIDTH.no,
    },
    {
      header: "KODE ITEM",
      key: "item_code",
      width: EXCEL_COL_WIDTH.itemCode,
    },
    {
      header: "NAMA ITEM",
      key: "item_name",
      width: EXCEL_COL_WIDTH.itemName,
    },
    {
      header: "KATEGORI",
      key: "category",
      width: EXCEL_COL_WIDTH.category,
    },
    {
      header: "SATUAN",
      key: "unit",
      width: EXCEL_COL_WIDTH.unit,
    },
    // Bagian Kebutuhan (BOQ)
    {
      header: "HARGA (RP)",
      key: "price_bom",
      width: EXCEL_COL_WIDTH.price,
    },
    {
      header: "VOLUME",
      key: "planned_vol",
      width: EXCEL_COL_WIDTH.qty,
    },
    {
      header: "SUBTOTAL (RP)",
      key: "planned_dpp",
      width: EXCEL_COL_WIDTH.subtotal,
    },
    {
      header: "PPN (RP)",
      key: "planned_tax",
      width: EXCEL_COL_WIDTH.tax,
    },
    {
      header: "TOTAL (RP)",
      key: "planned_budget",
      width: EXCEL_COL_WIDTH.total,
    },
    // Bagian Pengadaan (PO)
    {
      header: "HARGA (RP)",
      key: "price_po",
      width: EXCEL_COL_WIDTH.price,
    },
    {
      header: "VOLUME",
      key: "total_ordered",
      width: EXCEL_COL_WIDTH.qty,
    },
    {
      header: "SUBTOTAL (RP)",
      key: "total_order_dpp",
      width: EXCEL_COL_WIDTH.subtotal,
    },
    {
      header: "PPN (RP)",
      key: "total_order_tax",
      width: EXCEL_COL_WIDTH.tax,
    },
    {
      header: "TOTAL (RP)",
      key: "total_order_price",
      width: EXCEL_COL_WIDTH.total,
    },
    // Deviasi
    {
      header: "DEVIASI BIAYA (RP)",
      key: "variance",
      width: EXCEL_COL_WIDTH.variance,
    },
    // Bagian Penerimaan (NP)
    {
      header: "VOL. DITERIMA",
      key: "total_delivered",
      width: EXCEL_COL_WIDTH.qty,
    },
    {
      header: "VOL. BELUM TERIMA",
      key: "remaining",
      width: EXCEL_COL_WIDTH.qty,
    },
    {
      header: "% REALISASI",
      key: "delivery_pct",
      width: EXCEL_COL_WIDTH.percentage,
    },
  ];

  worksheet.columns = COLUMNS.map((column) => ({
    key: column.key,
    width: column.width,
  }));

  createFormalKop(worksheet, {
    endCol: "S",
    endColIdx: 19,
    startCol: "A",
    startColIdx: 1,
    subtitle: `${project_name} | ${company_name} | ${period}`,
    title: "LAPORAN PEMENUHAN",
  });

  // 1. Render Grouped Header 2 Baris (Baris 4 & 5)
  const TOTAL_HEADER_COLUMNS = 19;
  const headerGroupRow = worksheet.getRow(4);
  const subHeaderRow = worksheet.getRow(5);
  headerGroupRow.height = EXCEL_ROW_HEIGHT.tableHeaderGroup;
  subHeaderRow.height = EXCEL_ROW_HEIGHT.tableHeaderGroup;

  // Nilai Header Baris 4 (Top Level)
  headerGroupRow.getCell(1).value = "NO";
  headerGroupRow.getCell(2).value = "KODE ITEM";
  headerGroupRow.getCell(3).value = "NAMA ITEM";
  headerGroupRow.getCell(4).value = "KATEGORI";
  headerGroupRow.getCell(5).value = "SATUAN";
  headerGroupRow.getCell(6).value = "KEBUTUHAN";
  headerGroupRow.getCell(11).value = "PENGADAAN";
  headerGroupRow.getCell(16).value = "DEVIASI BIAYA (RP)";
  headerGroupRow.getCell(17).value = "PENERIMAAN";

  // Nilai Header Baris 5 (Sub Level)
  subHeaderRow.getCell(6).value = "HARGA (RP)";
  subHeaderRow.getCell(7).value = "VOLUME";
  subHeaderRow.getCell(8).value = "SUBTOTAL (RP)";
  subHeaderRow.getCell(9).value = "PPN (RP)";
  subHeaderRow.getCell(10).value = "TOTAL (RP)";

  subHeaderRow.getCell(11).value = "HARGA (RP)";
  subHeaderRow.getCell(12).value = "VOLUME";
  subHeaderRow.getCell(13).value = "SUBTOTAL (RP)";
  subHeaderRow.getCell(14).value = "PPN (RP)";
  subHeaderRow.getCell(15).value = "TOTAL (RP)";

  subHeaderRow.getCell(17).value = "VOL. DITERIMA";
  subHeaderRow.getCell(18).value = "SISA BELUM TERIMA";
  subHeaderRow.getCell(19).value = "% REALISASI FISIK";

  // Merge Cell Header
  worksheet.mergeCells("A4:A5");
  worksheet.mergeCells("B4:B5");
  worksheet.mergeCells("C4:C5");
  worksheet.mergeCells("D4:D5");
  worksheet.mergeCells("E4:E5");
  worksheet.mergeCells("F4:J4"); // KEBUTUHAN (5 Kolom: F–J)
  worksheet.mergeCells("K4:O4"); // PENGADAAN (5 Kolom: K–O)
  worksheet.mergeCells("P4:P5"); // DEVIASI BIAYA
  worksheet.mergeCells("Q4:S4"); // PENERIMAAN (3 Kolom: Q–S)

  // Styling seluruh cell header di Baris 4 & 5
  for (let rowIndex = 4; rowIndex <= 5; rowIndex++) {
    const currentRow = worksheet.getRow(rowIndex);

    for (let columnIndex = 1; columnIndex <= TOTAL_HEADER_COLUMNS; columnIndex++) {
      const cell = currentRow.getCell(columnIndex);
      cell.font = FONT_TABLE_HEADER;
      cell.fill = FILL_TABLE_HEADER;
      cell.alignment = ALIGN_HEADER;
      cell.border = BORDER_ALL_LIGHT;
    }
  }

  let totalPlannedVolume = 0;
  let totalPlannedDpp = 0;
  let totalPlannedTax = 0;
  let totalPlannedBudget = 0;
  let totalOrderedVolume = 0;
  let totalOrderDpp = 0;
  let totalOrderTax = 0;
  let totalOrderPrice = 0;
  let totalVariance = 0;
  let totalDeliveredVolume = 0;

  // 2. Pengelompokan data berdasarkan kategori
  const categoryMap = new Map<string, { categoryId: string; items: typeof fulfillmentItems }>();

  fulfillmentItems.forEach((item) => {
    const categoryName = (item.category || "LAINNYA").trim();
    const existingGroup = categoryMap.get(categoryName);

    if (existingGroup) {
      existingGroup.items.push(item);
    } else {
      categoryMap.set(categoryName, {
        categoryId: item.category_id || "\uffff",
        items: [item],
      });
    }
  });

  // 3. Urutkan kategori berdasarkan category_id
  const sortedCategoryEntries = Array.from(categoryMap.entries());

  sortedCategoryEntries.sort(([nameA, groupA], [nameB, groupB]) => {
    const idComparison = groupA.categoryId.localeCompare(groupB.categoryId);
    if (idComparison !== 0) {
      return idComparison;
    }
    return nameA.localeCompare(nameB);
  });

  let currentRowIndex = 6;
  let itemNumber = 1;

  for (const [categoryName, categoryGroup] of sortedCategoryEntries) {
    const categoryItems = categoryGroup.items;

    categoryItems.sort((firstItem, secondItem) => {
      const isFirstUnplanned = Boolean(firstItem.is_unplanned);
      const isSecondUnplanned = Boolean(secondItem.is_unplanned);

      if (isFirstUnplanned !== isSecondUnplanned) {
        return isFirstUnplanned ? 1 : -1;
      }

      const firstName = firstItem.item_name || "";
      const secondName = secondItem.item_name || "";
      return firstName.localeCompare(secondName);
    });

    // Render Baris Header Kategori
    const categoryRowIndex = currentRowIndex;
    currentRowIndex += 1;

    const categoryRow = worksheet.getRow(categoryRowIndex);
    categoryRow.height = EXCEL_ROW_HEIGHT.categoryHeader;

    worksheet.mergeCells(`A${categoryRowIndex}:S${categoryRowIndex}`);
    const firstCategoryCell = worksheet.getCell(`A${categoryRowIndex}`);
    firstCategoryCell.value = categoryName.toUpperCase();
    firstCategoryCell.font = FONT_CATEGORY_HEADER;
    firstCategoryCell.alignment = ALIGN_CATEGORY_HEADER;

    for (let columnIndex = 1; columnIndex <= TOTAL_HEADER_COLUMNS; columnIndex++) {
      const cell = categoryRow.getCell(columnIndex);
      cell.fill = FILL_SECONDARY_HEADER;
      cell.border = BORDER_ALL_LIGHT;
    }

    categoryItems.forEach((item) => {
      const rowNumber = currentRowIndex;
      currentRowIndex += 1;

      const row = worksheet.getRow(rowNumber);

      // Perhitungan unit price persis seperti pada tabel report aplikasi (useReportSummaryColumns.tsx)
      const plannedPrice = item.planned_volume > 0 ? item.planned_dpp / item.planned_volume : (item.price ?? 0);

      const poPrice = item.total_ordered > 0 ? item.total_order_dpp / item.total_ordered : 0;

      const plannedVolume = item.planned_volume || 0;
      const plannedDpp = item.planned_dpp || 0;
      const plannedTax = item.planned_tax || 0;
      const plannedBudget = item.planned_budget || 0;

      const orderedVolume = item.total_ordered || 0;
      const orderDpp = item.total_order_dpp || 0;
      const orderTax = item.total_order_tax || 0;
      const orderPrice = item.total_order_price || 0;

      const variance = calcVariance(plannedBudget, orderPrice);

      const deliveredVolume = item.total_delivered || 0;
      const remainingVolume = orderedVolume - deliveredVolume;
      const deliveryPercentage = calcRatio(deliveredVolume, orderedVolume);

      totalPlannedVolume += plannedVolume;
      totalPlannedDpp += plannedDpp;
      totalPlannedTax += plannedTax;
      totalPlannedBudget += plannedBudget;
      totalOrderedVolume += orderedVolume;
      totalOrderDpp += orderDpp;
      totalOrderTax += orderTax;
      totalOrderPrice += orderPrice;
      totalVariance += variance;
      totalDeliveredVolume += deliveredVolume;

      const itemCode = formatItemCode(item) || item.item_code || "-";
      const categoryDisplay = item.category || "-";
      const unitDisplay = item.unit || "-";

      // Nilai tampilan terformat konsisten dengan tabel report web:
      // Jika item unplanned, seluruh kolom BOQ berharga "-"
      const displayPriceBom = !item.is_unplanned && plannedPrice > 0 ? plannedPrice : "-";
      const displayPlannedVol = !item.is_unplanned && plannedVolume > 0 ? plannedVolume : "-";
      const displayPlannedDpp = !item.is_unplanned && plannedDpp > 0 ? plannedDpp : "-";
      const displayPlannedTax = !item.is_unplanned && plannedTax > 0 ? plannedTax : "-";
      const displayPlannedBudget = !item.is_unplanned && plannedBudget > 0 ? plannedBudget : "-";
      const displayPricePo = poPrice > 0 ? poPrice : "-";
      const displayOrderedVol = orderedVolume > 0 ? orderedVolume : "-";
      const displayOrderDpp = orderDpp > 0 ? orderDpp : "-";
      const displayOrderTax = orderTax > 0 ? orderTax : "-";
      const displayOrderPrice = orderPrice > 0 ? orderPrice : "-";
      const displayVariance = variance !== 0 ? variance : "-";
      const displayDelivered = deliveredVolume > 0 ? deliveredVolume : "-";
      const displayRemaining = remainingVolume > 0 ? remainingVolume : "-";
      const displayDeliveryPct = deliveryPercentage > 0 ? deliveryPercentage : "-";

      row.values = [
        itemNumber,
        itemCode,
        item.item_name,
        categoryDisplay,
        unitDisplay,
        displayPriceBom,
        displayPlannedVol,
        displayPlannedDpp,
        displayPlannedTax,
        displayPlannedBudget,
        displayPricePo,
        displayOrderedVol,
        displayOrderDpp,
        displayOrderTax,
        displayOrderPrice,
        displayVariance,
        displayDelivered,
        displayRemaining,
        displayDeliveryPct,
      ];
      itemNumber += 1;

      // Evaluasi status over per-cell (seperti pada useReportSummaryColumns aplikasi)
      const isPriceOver = !item.is_unplanned && poPrice > plannedPrice && orderedVolume > 0;
      const isVolumeOver = !item.is_unplanned && orderedVolume > plannedVolume && plannedVolume > 0;
      const isDppOver = !item.is_unplanned && orderDpp > plannedDpp && plannedDpp > 0;
      const isTaxOver = !item.is_unplanned && orderTax > plannedTax && plannedTax > 0;
      const isTotalOver = !item.is_unplanned && orderPrice > plannedBudget && plannedBudget > 0;
      const isVarianceOver = !item.is_unplanned && variance < 0;
      const isDeliveredOver =
        (orderedVolume > 0 && deliveredVolume > orderedVolume) ||
        (plannedVolume > 0 && deliveredVolume > plannedVolume);
      const isDeliveryPctOver = deliveryPercentage > 1.0;

      row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
        cell.border = BORDER_ALL_LIGHT;
        cell.font = FONT_REGULAR;

        // Pewarnaan per-sel (bukan row): hanya sel yang berlebih atau belanja di luar rencana
        let cellFill = FILL_WHITE;

        if (item.is_unplanned) {
          // Kolom Pengadaan (11-15) dan Penerimaan (17, 19) pada item di luar rencana
          if (
            columnNumber === 11 ||
            columnNumber === 12 ||
            columnNumber === 13 ||
            columnNumber === 14 ||
            columnNumber === 15 ||
            columnNumber === 17 ||
            columnNumber === 19
          ) {
            cellFill = FILL_UNPLANNED_CELL;
          }
        } else {
          // Sel over budget / over kuantitas
          if (columnNumber === 11 && isPriceOver) {
            cellFill = FILL_BUDGET_OVER_CELL;
          } else if (columnNumber === 12 && isVolumeOver) {
            cellFill = FILL_BUDGET_OVER_CELL;
          } else if (columnNumber === 13 && isDppOver) {
            cellFill = FILL_BUDGET_OVER_CELL;
          } else if (columnNumber === 14 && isTaxOver) {
            cellFill = FILL_BUDGET_OVER_CELL;
          } else if (columnNumber === 15 && isTotalOver) {
            cellFill = FILL_BUDGET_OVER_CELL;
          } else if (columnNumber === 16 && isVarianceOver) {
            cellFill = FILL_BUDGET_OVER_CELL;
          } else if (columnNumber === 17 && isDeliveredOver) {
            cellFill = FILL_BUDGET_OVER_CELL;
          } else if (columnNumber === 19 && isDeliveryPctOver) {
            cellFill = FILL_BUDGET_OVER_CELL;
          }
        }

        cell.fill = cellFill;

        const isCenterAligned = columnNumber === 1 || columnNumber === 2 || columnNumber === 4 || columnNumber === 5;

        const isLeftAligned = columnNumber === 3;

        if (isCenterAligned) {
          cell.alignment = ALIGN_CENTER;
        } else if (isLeftAligned) {
          cell.alignment = ALIGN_LEFT;
        } else {
          cell.alignment = ALIGN_RIGHT;
        }

        const isCurrencyColumn =
          columnNumber === 6 ||
          columnNumber === 8 ||
          columnNumber === 9 ||
          columnNumber === 10 ||
          columnNumber === 11 ||
          columnNumber === 13 ||
          columnNumber === 14 ||
          columnNumber === 15 ||
          columnNumber === 16;

        const isQuantityColumn =
          columnNumber === 7 || columnNumber === 12 || columnNumber === 17 || columnNumber === 18;

        const isPercentageColumn = columnNumber === 19;

        if (isCurrencyColumn && typeof cell.value === "number") {
          cell.numFmt = EXCEL_NUM_FMT.currency;
        } else if (isQuantityColumn && typeof cell.value === "number") {
          cell.numFmt = EXCEL_NUM_FMT.quantity;
        } else if (isPercentageColumn && typeof cell.value === "number") {
          cell.numFmt = EXCEL_NUM_FMT.percentage;
        }
      });
    });
  }

  // Baris Total Keseluruhan
  const totalRowIndex = currentRowIndex;
  currentRowIndex += 1;

  const totalRow = worksheet.getRow(totalRowIndex);

  const remainingVolumeTotal = totalOrderedVolume - totalDeliveredVolume;
  const overallDeliveryPercentage = calcRatio(totalDeliveredVolume, totalOrderedVolume) || "-";

  totalRow.values = [
    "",
    "TOTAL",
    "",
    "",
    "",
    "",
    totalPlannedVolume,
    totalPlannedDpp,
    totalPlannedTax,
    totalPlannedBudget,
    "",
    totalOrderedVolume,
    totalOrderDpp,
    totalOrderTax,
    totalOrderPrice,
    totalVariance,
    totalDeliveredVolume,
    remainingVolumeTotal,
    overallDeliveryPercentage,
  ];

  worksheet.mergeCells(`B${totalRowIndex}:E${totalRowIndex}`);

  totalRow.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    cell.font = FONT_TOTAL_ROW;
    cell.fill = FILL_TOTAL_ROW;
    cell.border = BORDER_ACCOUNTING_TOTAL;

    if (columnNumber === 2) {
      cell.alignment = ALIGN_RIGHT;
      return;
    }

    const isCurrencyColumn =
      columnNumber === 8 ||
      columnNumber === 9 ||
      columnNumber === 10 ||
      columnNumber === 13 ||
      columnNumber === 14 ||
      columnNumber === 15 ||
      columnNumber === 16;

    const isQuantityColumn = columnNumber === 7 || columnNumber === 12 || columnNumber === 17 || columnNumber === 18;

    const isPercentageColumn = columnNumber === 19;

    if (isCurrencyColumn) {
      cell.numFmt = EXCEL_NUM_FMT.currency;
      cell.alignment = ALIGN_RIGHT;
    } else if (isQuantityColumn) {
      cell.numFmt = EXCEL_NUM_FMT.quantity;
      cell.alignment = ALIGN_RIGHT;
    } else if (isPercentageColumn && typeof cell.value === "number") {
      cell.numFmt = EXCEL_NUM_FMT.percentage;
      cell.alignment = ALIGN_RIGHT;
    }
  });

  worksheet.autoFilter = "A5:S5";
}
