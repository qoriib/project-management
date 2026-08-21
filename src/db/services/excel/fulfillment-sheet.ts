import type * as ExcelJS from "exceljs";
import type { FulfillmentSheetContext } from "./types";
import { FORMAL_STYLE, BORDER_ALL_LIGHT, BORDER_ALL_THIN, BORDER_ACCOUNTING_TOTAL, createFormalKop } from "./styles";
import { formatItemCode } from "@/utils/formatters";

/**
 * Creates the BOM & PO fulfillment sheet (Kebutuhan & Realisasi).
 */
export function createFulfillmentSheet(workbook: ExcelJS.Workbook, context: FulfillmentSheetContext): void {
  const { project_name, company_name, fiscal_year, period, data } = context;
  const ws = workbook.addWorksheet("KEBUTUHAN & REALISASI", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 5, showGridLines: true }],
  });

  const COLUMNS = [
    { header: "NO", key: "no", width: 6 },
    { header: "KODE ITEM", key: "item_code", width: 16 },
    { header: "URAIAN MATERIAL / BARANG", key: "item_name", width: 36 },
    { header: "KATEGORI", key: "category", width: 16 },
    { header: "SATUAN", key: "unit", width: 10 },
    // BOM Section
    { header: "HARGA BOM (RP)", key: "price_bom", width: 16 },
    { header: "VOL. BOM", key: "planned_vol", width: 14 },
    { header: "SUBTOTAL BOM (RP)", key: "planned_dpp", width: 18 },
    { header: "PPN BOM (RP)", key: "planned_tax", width: 16 },
    { header: "TOTAL BOM (RP)", key: "planned_budget", width: 20 },
    // PO Section
    { header: "HARGA PO (RP)", key: "price_po", width: 16 },
    { header: "VOL. PO", key: "total_ordered", width: 14 },
    { header: "SUBTOTAL PO (RP)", key: "total_order_dpp", width: 18 },
    { header: "PPN PO (RP)", key: "total_order_tax", width: 16 },
    { header: "TOTAL PO (RP)", key: "total_order_price", width: 20 },
    // Variance & Status
    { header: "DEVIASI BIAYA (RP)", key: "variance", width: 18 },
    { header: "STATUS ANGGARAN", key: "status", width: 18 },
    // Delivery Section
    { header: "VOL. DITERIMA (NP)", key: "total_delivered", width: 16 },
    { header: "SISA BELUM TERIMA", key: "remaining", width: 16 },
    { header: "% REALISASI FISIK", key: "delivery_pct", width: 15 },
  ];

  // Set column keys and widths
  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  // Kop Formal
  createFormalKop(ws, {
    company_name,
    endCol: "T",
    endColIdx: 20,
    startCol: "A",
    startColIdx: 1,
    subtitle: `Proyek: ${project_name}  |  Tahun Anggaran: ${fiscal_year}  |  Periode: ${period}`,
    title: "REKAPITULASI KEBUTUHAN MATERIAL (BOM) & REALISASI PENGADAAN (PO)",
  });

  // Table Headers at Row 5
  const headerRow = ws.getRow(5);
  COLUMNS.forEach((col, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: FORMAL_STYLE.tableHeaderText }, name: FORMAL_STYLE.fontFamily, size: 9 };
    cell.fill = { fgColor: { argb: FORMAL_STYLE.tableHeaderBg }, pattern: "solid", type: "pattern" };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = BORDER_ALL_THIN;
  });

  // Data Aggregates
  let sumPlannedVol = 0;
  let sumPlannedDpp = 0;
  let sumPlannedTax = 0;
  let sumPlannedBudget = 0;

  let sumOrderedVol = 0;
  let sumOrderedDpp = 0;
  let sumOrderedTax = 0;
  let sumTotalOrderPrice = 0;

  let sumVariance = 0;
  let sumDeliveredVol = 0;

  data.forEach((item, index) => {
    const rowIdx = index + 6;
    const row = ws.getRow(rowIdx);

    const code = formatItemCode(item) || item.item_code || "-";
    const poPrice = item.total_ordered > 0 ? item.total_order_dpp / item.total_ordered : 0;
    const plannedPrice = item.planned_volume > 0 ? item.planned_dpp / item.planned_volume : (item.price ?? 0);

    const variance = (item.total_order_price || 0) - (item.planned_budget || 0);
    const remaining = Math.max(0, (item.total_ordered || 0) - (item.total_delivered || 0));
    const deliveryPct = item.total_ordered > 0 ? item.total_delivered / item.total_ordered : 0;

    let status = "Sesuai";
    if (item.is_unplanned) {
      status = "Item Non-BOM";
    } else if ((item.total_ordered || 0) === 0) {
      status = "Belum Dipesan";
    } else if (variance > 0) {
      status = "Melebihi Anggaran";
    } else if (variance < 0) {
      status = "Efisiensi (Hemat)";
    }

    sumPlannedVol += item.planned_volume || 0;
    sumPlannedDpp += item.planned_dpp || 0;
    sumPlannedTax += item.planned_tax || 0;
    sumPlannedBudget += item.planned_budget || 0;

    sumOrderedVol += item.total_ordered || 0;
    sumOrderedDpp += item.total_order_dpp || 0;
    sumOrderedTax += item.total_order_tax || 0;
    sumTotalOrderPrice += item.total_order_price || 0;

    sumVariance += variance;
    sumDeliveredVol += item.total_delivered || 0;

    const isEven = index % 2 === 1;

    row.values = [
      index + 1,
      code,
      item.item_name,
      item.category || "-",
      item.unit || "-",
      // BOM
      plannedPrice,
      item.planned_volume || 0,
      item.planned_dpp || 0,
      item.planned_tax || 0,
      item.planned_budget || 0,
      // PO
      poPrice,
      item.total_ordered || 0,
      item.total_order_dpp || 0,
      item.total_order_tax || 0,
      item.total_order_price || 0,
      // Variance & Status
      variance,
      status,
      // Delivery
      item.total_delivered || 0,
      remaining,
      deliveryPct,
    ];

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = BORDER_ALL_LIGHT;
      cell.font = { name: FORMAL_STYLE.fontFamily, size: 9 };

      if (isEven) {
        cell.fill = { fgColor: { argb: FORMAL_STYLE.zebraBg }, pattern: "solid", type: "pattern" };
      }

      // Column Alignment
      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 5 || colNumber === 17) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 3) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }

      // Currency format (Prices, DPP, Tax, Totals, Variance)
      if (
        colNumber === 6 ||
        colNumber === 8 ||
        colNumber === 9 ||
        colNumber === 10 ||
        colNumber === 11 ||
        colNumber === 13 ||
        colNumber === 14 ||
        colNumber === 15 ||
        colNumber === 16
      ) {
        cell.numFmt = "#,##0;(#,##0);-";
      }

      // Quantity format (Volumes)
      if (colNumber === 7 || colNumber === 12 || colNumber === 18 || colNumber === 19) {
        cell.numFmt = "#,##0.00;(#,##0.00);-";
      }

      // Percentage format
      if (colNumber === 20) {
        cell.numFmt = "0.0%";
      }

      // Status column font
      if (colNumber === 17) {
        cell.font = {
          bold: true,
          color: { argb: FORMAL_STYLE.statusNeutralText },
          name: FORMAL_STYLE.fontFamily,
          size: 9,
        };
      }
    });
  });

  // Total Summary Row
  const totalRowIdx = data.length + 6;
  const totalRow = ws.getRow(totalRowIdx);
  const totalFulfillmentPct = sumOrderedVol > 0 ? sumDeliveredVol / sumOrderedVol : 0;
  const totalRemaining = Math.max(0, sumOrderedVol - sumDeliveredVol);

  totalRow.values = [
    "",
    "TOTAL",
    "",
    "",
    "",
    "",
    sumPlannedVol,
    sumPlannedDpp,
    sumPlannedTax,
    sumPlannedBudget,
    "",
    sumOrderedVol,
    sumOrderedDpp,
    sumOrderedTax,
    sumTotalOrderPrice,
    sumVariance,
    sumVariance > 0 ? "Defisit Anggaran" : sumVariance < 0 ? "Surplus Anggaran" : "Seimbang",
    sumDeliveredVol,
    totalRemaining,
    totalFulfillmentPct,
  ];

  ws.mergeCells(`B${totalRowIdx}:E${totalRowIdx}`);

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true, color: { argb: FORMAL_STYLE.totalRowText }, name: FORMAL_STYLE.fontFamily, size: 9 };
    cell.fill = { fgColor: { argb: FORMAL_STYLE.totalRowBg }, pattern: "solid", type: "pattern" };
    cell.border = BORDER_ACCOUNTING_TOTAL;

    if (colNumber === 2) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    } else if (
      colNumber === 8 ||
      colNumber === 9 ||
      colNumber === 10 ||
      colNumber === 13 ||
      colNumber === 14 ||
      colNumber === 15 ||
      colNumber === 16
    ) {
      cell.numFmt = "#,##0;(#,##0);-";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 7 || colNumber === 12 || colNumber === 18 || colNumber === 19) {
      cell.numFmt = "#,##0.00;(#,##0.00);-";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 20) {
      cell.numFmt = "0.0%";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 17) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  // Enable AutoFilter on header row
  ws.autoFilter = "A5:T5";
}
