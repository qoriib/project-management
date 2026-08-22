import type * as ExcelJS from "exceljs";
import type { ExecutiveSummaryContext } from "./types";
import {
  BORDER_ACCOUNTING_TOTAL,
  BORDER_ALL_LIGHT,
  createFormalKop,
  EXCEL_NUM_FMT,
  FORMAL_STYLE,
  formatToDDMMYYYY,
  renderTableHeaderRow,
  type SheetColumnConfig,
} from "./styles";
import { formatItemCode } from "@/utils/formatters";

/**
 * Creates the Executive Summary Sheet formatted as an Item Monitoring & Contract Realization Table.
 */
export function createExecutiveSummarySheet(workbook: ExcelJS.Workbook, context: ExecutiveSummaryContext): void {
  const { project_name, company_name, fiscal_year, period, data, orderData, receiptData } = context;
  const ws = workbook.addWorksheet("RINGKASAN", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 5, showGridLines: true }],
  });

  const COLUMNS: SheetColumnConfig[] = [
    { header: "NO", key: "no", width: 6 },
    { header: "KODE ITEM", key: "item_code", width: 16 },
    { header: "URAIAN BARANG / PEKERJAAN", key: "item_name", width: 36 },
    { header: "SATUAN", key: "unit", width: 10 },
    { header: "VOL. KONTRAK / PLAFOND", key: "contract_vol", width: 22 },
    { header: "TGL. PERMINTAAN", key: "order_date", width: 18 },
    { header: "VOL. PERMINTAAN", key: "order_vol", width: 18 },
    { header: "TGL. PENERIMAAN", key: "receipt_date", width: 18 },
    { header: "VOL. PENERIMAAN", key: "receipt_vol", width: 18 },
    { header: "KUMULATIF PENERIMAAN", key: "cumulative_delivered", width: 22 },
    { header: "SISA VOL. PLAFOND", key: "sisa_plafond", width: 20 },
    { header: "% SISA KONTRAK", key: "sisa_kontrak_pct", width: 16 },
  ];

  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  createFormalKop(ws, {
    company_name,
    endCol: "L",
    endColIdx: 12,
    startCol: "A",
    startColIdx: 1,
    subtitle: `Proyek: ${project_name}  |  Tahun Anggaran: ${fiscal_year}  |  Periode: ${period}`,
    title: "REKAPITULASI VOLUME ITEM & REALISASI PENERIMAAN (SUMMARY MONITORING)",
  });

  renderTableHeaderRow(ws, COLUMNS, 5);

  let sumContractVol = 0;
  let sumOrderVol = 0;
  let sumLatestReceiptVol = 0;
  let sumCumulativeDelivered = 0;
  let sumSisaPlafond = 0;

  data.forEach((item, index) => {
    const rowIdx = index + 6;
    const row = ws.getRow(rowIdx);

    const matchingOrders = orderData.filter((o) => o.item_name === item.item_name);
    const matchingReceipts = receiptData.filter((r) => r.item_name === item.item_name);

    const latestOrder = matchingOrders.length > 0 ? matchingOrders[matchingOrders.length - 1] : null;
    const orderDateStr = latestOrder ? formatToDDMMYYYY(latestOrder.order_date) : "-";
    const orderVol = item.total_ordered || 0;

    const latestReceipt = matchingReceipts.length > 0 ? matchingReceipts[matchingReceipts.length - 1] : null;
    const receiptDateStr = latestReceipt ? formatToDDMMYYYY(latestReceipt.receipt_date) : "-";
    const latestReceiptVol = latestReceipt ? latestReceipt.qty : item.total_delivered || 0;

    const isPlanned = !item.is_unplanned && (item.planned_volume || 0) > 0;
    const contractVol = isPlanned ? (item.planned_volume ?? 0) : null;
    const cumulativeDelivered = item.total_delivered || 0;
    const sisaPlafond = isPlanned ? (item.planned_volume ?? 0) - cumulativeDelivered : null;
    const sisaKontrakPct =
      isPlanned && (item.planned_volume ?? 0) > 0
        ? ((item.planned_volume ?? 0) - cumulativeDelivered) / (item.planned_volume ?? 1)
        : null;

    const code = formatItemCode(item) || item.item_code || "-";

    if (contractVol !== null) sumContractVol += contractVol;
    sumOrderVol += orderVol;
    sumLatestReceiptVol += latestReceiptVol;
    sumCumulativeDelivered += cumulativeDelivered;
    if (sisaPlafond !== null) sumSisaPlafond += sisaPlafond;

    row.values = [
      index + 1,
      code,
      item.item_name,
      item.unit || "-",
      contractVol !== null ? contractVol : "-",
      orderDateStr,
      orderVol > 0 ? orderVol : "-",
      receiptDateStr,
      latestReceiptVol > 0 ? latestReceiptVol : "-",
      cumulativeDelivered > 0 ? cumulativeDelivered : "-",
      sisaPlafond !== null ? sisaPlafond : "-",
      sisaKontrakPct !== null ? sisaKontrakPct : "-",
    ];

    const isEven = index % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = BORDER_ALL_LIGHT;
      cell.font = { name: FORMAL_STYLE.fontFamily, size: 9 };
      if (isEven) {
        cell.fill = { fgColor: { argb: FORMAL_STYLE.zebraBg }, pattern: "solid", type: "pattern" };
      }

      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 6 || colNumber === 8) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 3) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }

      if (colNumber === 5 || colNumber === 7 || colNumber === 9 || colNumber === 10 || colNumber === 11) {
        if (typeof cell.value === "number") {
          cell.numFmt = EXCEL_NUM_FMT.quantity;
        }
      }
      if (colNumber === 12 && typeof cell.value === "number") {
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
    sumContractVol,
    "",
    sumOrderVol,
    "",
    sumLatestReceiptVol,
    sumCumulativeDelivered,
    sumSisaPlafond,
    sumContractVol > 0 ? sumSisaPlafond / sumContractVol : "-",
  ];

  ws.mergeCells(`B${totalRowIdx}:D${totalRowIdx}`);

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true, color: { argb: FORMAL_STYLE.totalRowText }, name: FORMAL_STYLE.fontFamily, size: 9 };
    cell.fill = { fgColor: { argb: FORMAL_STYLE.totalRowBg }, pattern: "solid", type: "pattern" };
    cell.border = BORDER_ACCOUNTING_TOTAL;

    if (colNumber === 2) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    } else if (colNumber === 5 || colNumber === 7 || colNumber === 9 || colNumber === 10 || colNumber === 11) {
      cell.numFmt = EXCEL_NUM_FMT.quantity;
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 12 && typeof cell.value === "number") {
      cell.numFmt = EXCEL_NUM_FMT.percentage;
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  ws.autoFilter = "A5:L5";

  // Lembar Pengesahan / Tanda Tangan (Standar Formal Instansi)
  const curRow = totalRowIdx + 3;
  ws.getCell(`B${curRow}`).value = "Mengetahui / Menyetujui,";
  ws.getCell(`B${curRow}`).font = { bold: true, name: FORMAL_STYLE.fontFamily, size: 10 };

  ws.getCell(`I${curRow}`).value = "Dibuat Oleh,";
  ws.getCell(`I${curRow}`).font = { bold: true, name: FORMAL_STYLE.fontFamily, size: 10 };

  const titleRow = curRow + 1;
  ws.getCell(`B${titleRow}`).value = "Pejabat Pembuat Komitmen / Manajer Proyek";
  ws.getCell(`B${titleRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 9 };

  ws.getCell(`I${titleRow}`).value = "Bagian Logistik & Pengadaan";
  ws.getCell(`I${titleRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 9 };

  const signRow = curRow + 5;
  ws.getCell(`B${signRow}`).value = "( .................................................... )";
  ws.getCell(`B${signRow}`).font = { bold: true, name: FORMAL_STYLE.fontFamily, size: 10 };

  ws.getCell(`I${signRow}`).value = "( .................................................... )";
  ws.getCell(`I${signRow}`).font = { bold: true, name: FORMAL_STYLE.fontFamily, size: 10 };
}
