import type * as ExcelJS from "exceljs";
import type { FulfillmentSheetContext } from "./types";
import {
  BORDER_ACCOUNTING_TOTAL,
  BORDER_ALL_LIGHT,
  createFormalKop,
  EXCEL_NUM_FMT,
  FORMAL_STYLE,
  renderTableHeaderRow,
  type SheetColumnConfig,
} from "./styles";
import { formatItemCode } from "@/utils/formatters";

/**
 * Creates the BOM & PO fulfillment sheet (Kebutuhan & Realisasi).
 */
export function createFulfillmentSheet(workbook: ExcelJS.Workbook, context: FulfillmentSheetContext): void {
  const { project_name, company_name, fiscal_year, period, data } = context;
  const ws = workbook.addWorksheet("KEBUTUHAN & REALISASI", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 5, showGridLines: true }],
  });

  const COLUMNS: SheetColumnConfig[] = [
    { header: "NO", key: "no", width: 6 },
    { header: "KODE ITEM", key: "item_code", width: 16 },
    { header: "URAIAN BARANG / PEKERJAAN", key: "item_name", width: 36 },
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

  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  createFormalKop(ws, {
    company_name,
    endCol: "T",
    endColIdx: 20,
    startCol: "A",
    startColIdx: 1,
    subtitle: `Proyek: ${project_name}  |  Tahun Anggaran: ${fiscal_year}  |  Periode: ${period}`,
    title: "REKAPITULASI KEBUTUHAN ITEM (BOM) & REALISASI PENGADAAN (PO)",
  });

  renderTableHeaderRow(ws, COLUMNS, 5);

  let sumPlannedVol = 0;
  let sumPlannedDpp = 0;
  let sumPlannedTax = 0;
  let sumPlannedBudget = 0;
  let sumOrderedVol = 0;
  let sumOrderDpp = 0;
  let sumOrderTax = 0;
  let sumOrderPrice = 0;
  let sumVariance = 0;
  let sumDelivered = 0;

  data.forEach((item, index) => {
    const rowIdx = index + 6;
    const row = ws.getRow(rowIdx);

    const priceBom = item.planned_variants.length > 0 ? item.planned_variants[0].price : item.price || 0;
    const pricePo = item.order_variants.length > 0 ? item.order_variants[0].price : 0;
    const plannedVol = item.planned_volume || 0;
    const plannedDpp = item.planned_dpp || 0;
    const plannedTax = item.planned_tax || 0;
    const plannedBudget = item.planned_budget || 0;

    const orderedVol = item.total_ordered || 0;
    const orderDpp = item.total_order_dpp || 0;
    const orderTax = item.total_order_tax || 0;
    const orderPrice = item.total_order_price || 0;

    const variance = plannedBudget > 0 ? plannedBudget - orderPrice : -orderPrice;
    let statusText = "SESUAI";
    if (item.is_unplanned) {
      statusText = "NON-RENCANA";
    } else if (variance < 0) {
      statusText = "OVER BUDGET";
    } else if (variance > 0 && orderPrice > 0) {
      statusText = "EFISIENSI";
    } else if (orderPrice === 0) {
      statusText = "BELUM PESAN";
    }

    const delivered = item.total_delivered || 0;
    const remaining = orderedVol - delivered;
    const deliveryPct = orderedVol > 0 ? delivered / orderedVol : 0;

    sumPlannedVol += plannedVol;
    sumPlannedDpp += plannedDpp;
    sumPlannedTax += plannedTax;
    sumPlannedBudget += plannedBudget;
    sumOrderedVol += orderedVol;
    sumOrderDpp += orderDpp;
    sumOrderTax += orderTax;
    sumOrderPrice += orderPrice;
    sumVariance += variance;
    sumDelivered += delivered;

    const code = formatItemCode(item) || item.item_code || "-";

    row.values = [
      index + 1,
      code,
      item.item_name,
      item.category || "-",
      item.unit || "-",
      priceBom > 0 ? priceBom : "-",
      plannedVol > 0 ? plannedVol : "-",
      plannedDpp > 0 ? plannedDpp : "-",
      plannedTax > 0 ? plannedTax : "-",
      plannedBudget > 0 ? plannedBudget : "-",
      pricePo > 0 ? pricePo : "-",
      orderedVol > 0 ? orderedVol : "-",
      orderDpp > 0 ? orderDpp : "-",
      orderTax > 0 ? orderTax : "-",
      orderPrice > 0 ? orderPrice : "-",
      variance !== 0 ? variance : "-",
      statusText,
      delivered > 0 ? delivered : "-",
      remaining > 0 ? remaining : "-",
      deliveryPct > 0 ? deliveryPct : "-",
    ];

    const isEven = index % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = BORDER_ALL_LIGHT;
      cell.font = { name: FORMAL_STYLE.fontFamily, size: 9 };
      if (item.is_unplanned) {
        cell.fill = { fgColor: { argb: FORMAL_STYLE.unplannedRowBg }, pattern: "solid", type: "pattern" };
      } else if (isEven) {
        cell.fill = { fgColor: { argb: FORMAL_STYLE.zebraBg }, pattern: "solid", type: "pattern" };
      }

      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 5 || colNumber === 17) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 3) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }

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
        if (typeof cell.value === "number") {
          cell.numFmt = EXCEL_NUM_FMT.currency;
        }
      }
      if (colNumber === 7 || colNumber === 12 || colNumber === 18 || colNumber === 19) {
        if (typeof cell.value === "number") {
          cell.numFmt = EXCEL_NUM_FMT.quantity;
        }
      }
      if (colNumber === 20 && typeof cell.value === "number") {
        cell.numFmt = EXCEL_NUM_FMT.percentage;
      }
    });
  });

  // Total Row
  const totalRowIdx = data.length + 6;
  const totalRow = ws.getRow(totalRowIdx);
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
    sumOrderDpp,
    sumOrderTax,
    sumOrderPrice,
    sumVariance,
    "",
    sumDelivered,
    sumOrderedVol - sumDelivered,
    sumOrderedVol > 0 ? sumDelivered / sumOrderedVol : "-",
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
      cell.numFmt = EXCEL_NUM_FMT.currency;
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 7 || colNumber === 12 || colNumber === 18 || colNumber === 19) {
      cell.numFmt = EXCEL_NUM_FMT.quantity;
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 20 && typeof cell.value === "number") {
      cell.numFmt = EXCEL_NUM_FMT.percentage;
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  ws.autoFilter = "A5:T5";
}
