import type * as ExcelJS from "exceljs";
import type { FulfillmentSheetContext } from "./types";
import {
  ALIGN_CATEGORY_HEADER,
  ALIGN_CENTER,
  ALIGN_HEADER,
  ALIGN_LEFT,
  ALIGN_RIGHT,
  BORDER_ACCOUNTING_TOTAL,
  BORDER_ALL_LIGHT,
  type BudgetStatus,
  EXCEL_COL_WIDTH,
  EXCEL_NUM_FMT,
  EXCEL_ROW_HEIGHT,
  FILL_SECONDARY_HEADER,
  FILL_TABLE_HEADER,
  FILL_TOTAL_ROW,
  FONT_CATEGORY_HEADER,
  FONT_REGULAR,
  FONT_TABLE_HEADER,
  FONT_TOTAL_ROW,
  FULFILLMENT_SHEET_VIEW,
  getBudgetStatusFill,
} from "./styles";
import { createFormalKop, type SheetColumnConfig } from "./utils";
import { formatItemCode } from "@/utils/formatters";

export function createFulfillmentSheet(workbook: ExcelJS.Workbook, context: FulfillmentSheetContext): void {
  const {
    project_name: projectName,
    company_name: companyName,
    fiscal_year: fiscalYear,
    period,
    data: fulfillmentItems,
  } = context;

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
    // Bagian Kebutuhan (BOM)
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
    // Bagian Pemesanan (PO)
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
    company_name: companyName,
    endCol: "S",
    endColIdx: 19,
    startCol: "A",
    startColIdx: 1,
    subtitle: `Proyek: ${projectName}  |  Tahun Anggaran: ${fiscalYear}  |  Periode: ${period}`,
    title: "RINCIAN PEMENUHAN",
  });

  // 1. Render Grouped Header 2 Baris (Baris 5 & 6)
  const TOTAL_HEADER_COLUMNS = 19;
  const headerGroupRow = worksheet.getRow(5);
  const subHeaderRow = worksheet.getRow(6);
  headerGroupRow.height = EXCEL_ROW_HEIGHT.tableHeaderGroup;
  subHeaderRow.height = EXCEL_ROW_HEIGHT.tableHeaderGroup;

  // Nilai Header Baris 5 (Top Level)
  headerGroupRow.getCell(1).value = "NO";
  headerGroupRow.getCell(2).value = "KODE ITEM";
  headerGroupRow.getCell(3).value = "NAMA ITEM";
  headerGroupRow.getCell(4).value = "KATEGORI";
  headerGroupRow.getCell(5).value = "SATUAN";
  headerGroupRow.getCell(6).value = "KEBUTUHAN";
  headerGroupRow.getCell(11).value = "PEMESANAN";
  headerGroupRow.getCell(16).value = "DEVIASI BIAYA (RP)";
  headerGroupRow.getCell(17).value = "PENERIMAAN";

  // Nilai Header Baris 6 (Sub Level)
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
  worksheet.mergeCells("A5:A6");
  worksheet.mergeCells("B5:B6");
  worksheet.mergeCells("C5:C6");
  worksheet.mergeCells("D5:D6");
  worksheet.mergeCells("E5:E6");
  worksheet.mergeCells("F5:J5"); // KEBUTUHAN (5 Kolom: F–J)
  worksheet.mergeCells("K5:O5"); // PEMESANAN (5 Kolom: K–O)
  worksheet.mergeCells("P5:P6"); // DEVIASI BIAYA
  worksheet.mergeCells("Q5:S5"); // PENERIMAAN (3 Kolom: Q–S)

  // Styling seluruh cell header di Baris 5 & 6
  for (let rowIndex = 5; rowIndex <= 6; rowIndex++) {
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

  let currentRowIndex = 7;
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

    worksheet.mergeCells(`A${categoryRowIndex}:T${categoryRowIndex}`);
    const firstCategoryCell = worksheet.getCell(`A${categoryRowIndex}`);
    firstCategoryCell.value = `KATEGORI: ${categoryName.toUpperCase()}`;
    firstCategoryCell.font = FONT_CATEGORY_HEADER;
    firstCategoryCell.alignment = ALIGN_CATEGORY_HEADER;

    for (let columnIndex = 1; columnIndex <= 20; columnIndex++) {
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

      const variance = plannedBudget > 0 ? plannedBudget - orderPrice : -orderPrice;

      // Logika status finansial baris (sama persis dengan useReportSummaryColumns):
      // - unplanned: item belanja di luar BOM (kontras amber/orange)
      // - over: nilai PO melebihi pagu BOM dan ada pemesanan (kontras red alert)
      // - under: default normal putih (efisiensi anggaran, tidak perlu dikhawatirkan)
      let budgetStatus: BudgetStatus = "normal";

      if (item.is_unplanned) {
        budgetStatus = "unplanned";
      } else if (orderPrice > plannedBudget && orderedVolume > 0) {
        budgetStatus = "over";
      }

      const deliveredVolume = item.total_delivered || 0;
      const remainingVolume = orderedVolume - deliveredVolume;
      const deliveryPercentage = orderedVolume > 0 ? deliveredVolume / orderedVolume : 0;

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
      // Jika item unplanned, seluruh kolom BOM berharga "-"
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

      const rowFill = getBudgetStatusFill(budgetStatus);

      row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
        cell.border = BORDER_ALL_LIGHT;
        cell.font = FONT_REGULAR;
        cell.fill = rowFill;

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
  const overallDeliveryPercentage = totalOrderedVolume > 0 ? totalDeliveredVolume / totalOrderedVolume : "-";

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
      cell.alignment = ALIGN_CENTER;
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

  worksheet.autoFilter = "A6:S6";
}
