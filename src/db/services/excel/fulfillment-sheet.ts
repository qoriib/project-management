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
    views: [{ state: "frozen", xSplit: 0, ySplit: 6, showGridLines: true }],
  });

  ws.columns = [
    { header: "NO", key: "no", width: 5 },
    { header: "KODE ITEM", key: "item_code", width: 16 },
    { header: "URAIAN MATERIAL / BARANG", key: "item_name", width: 34 },
    { header: "KATEGORI", key: "category", width: 16 },
    { header: "SATUAN", key: "unit", width: 10 },
    { header: "HARGA SATUAN (RP)", key: "price", width: 18 },
    { header: "VOL. RENCANA", key: "planned_vol", width: 15 },
    { header: "TOTAL ANGGARAN (RP)", key: "planned_budget", width: 22 },
    { header: "VOL. DIPESAN", key: "total_ordered", width: 15 },
    { header: "TOTAL REALISASI (RP)", key: "total_order_price", width: 22 },
    { header: "DEVIASI BIAYA (RP)", key: "variance", width: 20 },
    { header: "STATUS ANGGARAN", key: "status", width: 18 },
    { header: "VOL. DITERIMA", key: "total_delivered", width: 15 },
    { header: "SISA BELUM TERIMA", key: "remaining", width: 18 },
    { header: "% REALISASI FISIK", key: "delivery_pct", width: 16 },
  ];

  // Kop Formal
  createFormalKop(ws, {
    startCol: "A",
    endCol: "O",
    startColIdx: 1,
    endColIdx: 15,
    company_name,
    title: "REKAPITULASI KEBUTUHAN MATERIAL & REALISASI PENGADAAN (BOM)",
    subtitle: `Proyek: ${project_name}  |  Tahun Anggaran: ${fiscal_year}  |  Periode: ${period}`,
  });

  ws.getRow(4).height = 6;

  // Table Headers
  const headerRow = ws.getRow(5);
  headerRow.height = 28;
  ws.columns.forEach((_, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.font = { name: FORMAL_STYLE.fontFamily, bold: true, size: 9, color: { argb: FORMAL_STYLE.tableHeaderText } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.tableHeaderBg } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
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
    row.height = 20;

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
    const isUnplanned = Boolean(item.is_unplanned);

    row.values = [
      index + 1,
      code,
      item.item_name,
      item.category || "-",
      item.unit || "-",
      item.price || 0,
      item.is_unplanned ? 0 : item.planned_volume || 0,
      item.is_unplanned ? 0 : item.planned_budget || 0,
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

      if (isUnplanned) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.unplannedRowBg } };
      } else if (isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.zebraBg } };
      }

      if (colNumber === 1 || colNumber === 4 || colNumber === 5) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else if (colNumber === 2) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.font = { name: FORMAL_STYLE.fontFamily, size: 9, bold: true };
      } else if (colNumber === 3) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      } else if (colNumber === 6 || colNumber === 8 || colNumber === 10 || colNumber === 11) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = "#,##0";
        if (colNumber === 11) {
          cell.font = {
            name: FORMAL_STYLE.fontFamily,
            size: 9,
            bold: true,
            color:
              variance > 0
                ? { argb: FORMAL_STYLE.statusRedText }
                : variance < 0
                  ? { argb: FORMAL_STYLE.statusGreenText }
                  : { argb: "FF000000" },
          };
        }
      } else if (colNumber === 7 || colNumber === 9 || colNumber === 13 || colNumber === 14) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = "#,##0.00";
      } else if (colNumber === 12) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.font = {
          name: FORMAL_STYLE.fontFamily,
          size: 8.5,
          bold: true,
          color:
            status === "Melebihi Anggaran"
              ? { argb: FORMAL_STYLE.statusRedText }
              : status === "Efisiensi (Hemat)"
                ? { argb: FORMAL_STYLE.statusGreenText }
                : status === "Item Non-Rencana"
                  ? { argb: "FF996600" }
                  : { argb: "FF333333" },
        };
      } else if (colNumber === 15) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = "0.00%";
        cell.font = { name: FORMAL_STYLE.fontFamily, size: 9, bold: true };
      }
    });
  });

  // Grand Total Row
  const totalRowIdx = data.length + 6;
  const totalRow = ws.getRow(totalRowIdx);
  totalRow.height = 24;

  totalRow.values = [
    "",
    "TOTAL",
    `Total ${data.length} Material`,
    "",
    "",
    "",
    sumPlannedVol,
    sumPlannedBudget,
    sumOrderedVol,
    sumTotalOrderPrice,
    sumVariance,
    "",
    sumDeliveredVol,
    Math.max(0, sumOrderedVol - sumDeliveredVol),
    sumOrderedVol > 0 ? sumDeliveredVol / sumOrderedVol : 0,
  ];

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.border = BORDER_ACCOUNTING_TOTAL;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.totalRowBg } };
    cell.font = { name: FORMAL_STYLE.fontFamily, size: 9.5, bold: true, color: { argb: FORMAL_STYLE.totalRowText } };

    if (colNumber === 2) {
      cell.alignment = { vertical: "middle", horizontal: "center" };
    } else if (colNumber === 3) {
      cell.alignment = { vertical: "middle", horizontal: "left" };
    } else if (colNumber === 7 || colNumber === 9 || colNumber === 13 || colNumber === 14) {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = "#,##0.00";
    } else if (colNumber === 8 || colNumber === 10 || colNumber === 11) {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = "#,##0";
    } else if (colNumber === 15) {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = "0.00%";
    }
  });

  ws.autoFilter = {
    from: "A5",
    to: "O5",
  };
}
