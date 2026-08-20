import type * as ExcelJS from "exceljs";
import type { FulfillmentSheetContext } from "./types";
import { FORMAL_STYLE, BORDER_ALL_LIGHT, BORDER_ALL_THIN, BORDER_ACCOUNTING_TOTAL, createFormalKop } from "./styles";
import { formatItemCode } from "@/utils/formatters";

/**
 * Creates the BOM fulfillment sheet (Kebutuhan & Realisasi).
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
    { header: "HARGA SATUAN (RP)", key: "price", width: 18 },
    { header: "VOL. RENCANA", key: "planned_vol", width: 15 },
    { header: "TOTAL ANGGARAN (RP)", key: "planned_budget", width: 22 },
    { header: "VOL. DIPESAN", key: "total_ordered", width: 15 },
    { header: "TOTAL REALISASI (RP)", key: "total_order_price", width: 22 },
    { header: "DEVIASI BIAYA (RP)", key: "variance", width: 20 },
    { header: "STATUS ANGGARAN", key: "status", width: 20 },
    { header: "VOL. DITERIMA", key: "total_delivered", width: 15 },
    { header: "SISA BELUM TERIMA", key: "remaining", width: 18 },
    { header: "% REALISASI FISIK", key: "delivery_pct", width: 16 },
  ];

  // Set column keys and widths without automatically placing headers at Row 1
  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  // Kop Formal
  createFormalKop(ws, {
    company_name,
    endCol: "O",
    endColIdx: 15,
    startCol: "A",
    startColIdx: 1,
    subtitle: `Proyek: ${project_name}  |  Tahun Anggaran: ${fiscal_year}  |  Periode: ${period}`,
    title: "REKAPITULASI KEBUTUHAN MATERIAL & REALISASI PENGADAAN (BOM)",
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

  // Data Rows
  let sumPlannedBudget = 0;
  let sumTotalOrderPrice = 0;
  let sumVariance = 0;
  let sumPlannedVol = 0;
  let sumOrderedVol = 0;
  let sumDeliveredVol = 0;

  data.forEach((item, index) => {
    const rowIdx = index + 6;
    const row = ws.getRow(rowIdx);

    const code = formatItemCode(item) || item.item_code || "-";
    const variance = (item.total_order_price || 0) - (item.planned_budget || 0);
    const remaining = Math.max(0, (item.total_ordered || 0) - (item.total_delivered || 0));
    const deliveryPct = item.total_ordered > 0 ? item.total_delivered / item.total_ordered : 0;

    let status = "Sesuai";
    if (item.is_unplanned) {
      status = "Item Non-Rencana";
    } else if ((item.total_ordered || 0) === 0) {
      status = "Belum Dipesan";
    } else if (variance > 0) {
      status = "Melebihi Anggaran";
    } else if (variance < 0) {
      status = "Efisiensi (Hemat)";
    }

    sumPlannedBudget += item.planned_budget || 0;
    sumTotalOrderPrice += item.total_order_price || 0;
    sumVariance += variance;
    sumPlannedVol += item.planned_volume || 0;
    sumOrderedVol += item.total_ordered || 0;
    sumDeliveredVol += item.total_delivered || 0;

    const isEven = index % 2 === 1;

    row.values = [
      index + 1,
      code,
      item.item_name,
      item.category || "-",
      item.unit || "-",
      item.price || 0,
      item.planned_volume || 0,
      item.planned_budget || 0,
      item.total_ordered || 0,
      item.total_order_price || 0,
      variance,
      status,
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

      // Column Alignment & Formats
      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 5 || colNumber === 12) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 3) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }

      // Currency format
      if (colNumber === 6 || colNumber === 8 || colNumber === 10 || colNumber === 11) {
        cell.numFmt = "#,##0;(#,##0);-";
      }
      // Quantity format
      if (colNumber === 7 || colNumber === 9 || colNumber === 13 || colNumber === 14) {
        cell.numFmt = "#,##0.00;(#,##0.00);-";
      }
      // Percentage format
      if (colNumber === 15) {
        cell.numFmt = "0.0%";
      }

      // Neutral grayscale styling for status
      if (colNumber === 12) {
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
    sumPlannedBudget,
    sumOrderedVol,
    sumTotalOrderPrice,
    sumVariance,
    sumVariance > 0 ? "Defisit Anggaran" : sumVariance < 0 ? "Surplus Anggaran" : "Seimbang",
    sumDeliveredVol,
    totalRemaining,
    totalFulfillmentPct,
  ];

  ws.mergeCells(`B${totalRowIdx}:F${totalRowIdx}`);

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true, color: { argb: FORMAL_STYLE.totalRowText }, name: FORMAL_STYLE.fontFamily, size: 9 };
    cell.fill = { fgColor: { argb: FORMAL_STYLE.totalRowBg }, pattern: "solid", type: "pattern" };
    cell.border = BORDER_ACCOUNTING_TOTAL;

    if (colNumber === 2) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    } else if (colNumber === 8 || colNumber === 10 || colNumber === 11) {
      cell.numFmt = "#,##0;(#,##0);-";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 7 || colNumber === 9 || colNumber === 13 || colNumber === 14) {
      cell.numFmt = "#,##0.00;(#,##0.00);-";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 15) {
      cell.numFmt = "0.0%";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 12) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  // Enable AutoFilter on header row
  ws.autoFilter = "A5:O5";
}
