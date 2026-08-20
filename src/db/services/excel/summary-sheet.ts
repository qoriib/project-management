import type * as ExcelJS from "exceljs";
import type { ExecutiveSummaryContext } from "./types";
import { FORMAL_STYLE, BORDER_ALL_LIGHT, BORDER_ALL_THIN, BORDER_ACCOUNTING_TOTAL, createFormalKop } from "./styles";

/**
 * Format ISO date string (YYYY-MM-DD) to DD/MM/YYYY.
 */
function formatToDDMMYYYY(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Creates the Executive Summary Sheet formatted as a Material Monitoring & Contract Realization Table.
 */
export function createExecutiveSummarySheet(workbook: ExcelJS.Workbook, context: ExecutiveSummaryContext): void {
  const { project_name, company_name, fiscal_year, period, data, orderData, receiptData } = context;
  const ws = workbook.addWorksheet("RINGKASAN", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 5, showGridLines: true }],
  });

  const COLUMNS = [
    { header: "NO.", key: "no", width: 6 },
    { header: "MATERIAL", key: "material", width: 36 },
    { header: "VOLUME PLAFOND MATERIAL", key: "plafond_vol", width: 20 },
    { header: "TANGGAL PERMINTAAN", key: "order_date", width: 18 },
    { header: "VOLUME PERMINTAAN", key: "order_vol", width: 18 },
    { header: "TANGGAL PENERIMAAN", key: "receipt_date", width: 18 },
    { header: "VOLUME PENERIMAAN", key: "receipt_vol", width: 18 },
    { header: "VOLUME PENERIMAAN DARI AWAL S/D MINGGU INI", key: "cumulative_delivered", width: 26 },
    {
      header: "SISA VOLUME PLAFOND (Volume Plafond Material Dikurangin Volume Penerimaan S/D Minggu Ini)",
      key: "sisa_plafond",
      width: 26,
    },
    { header: "VOLUME KONTRAK", key: "contract_vol", width: 18 },
    {
      header: "SISA VOLUME DARI KONTRAK (Volume Kontrak Dikurangi Volume Penerimaan Dari Awal S/D Minggu Ini)",
      key: "sisa_kontrak_pct",
      width: 26,
    },
    { header: "KETERANGAN", key: "keterangan", width: 34 },
  ];

  // Set column keys and widths
  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  // Kop Formal
  createFormalKop(ws, {
    company_name,
    endCol: "L",
    endColIdx: 12,
    startCol: "A",
    startColIdx: 1,
    subtitle: `Proyek: ${project_name}  |  Tahun Anggaran: ${fiscal_year}  |  Periode: ${period}`,
    title: "REKAPITULASI VOLUME MATERIAL & REALISASI PENERIMAAN (SUMMARY MONITORING)",
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

  let sumPlafond = 0;
  let sumOrderVol = 0;
  let sumLatestReceiptVol = 0;
  let sumCumulativeDelivered = 0;
  let sumSisaPlafond = 0;
  let sumContractVol = 0;

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
    const plafondVol = isPlanned ? (item.planned_volume ?? 0) : null;
    const contractVol = isPlanned ? (item.planned_volume ?? 0) : null;
    const cumulativeDelivered = item.total_delivered || 0;
    const sisaPlafond = isPlanned ? (item.planned_volume ?? 0) - cumulativeDelivered : null;
    const sisaKontrakPct =
      isPlanned && (item.planned_volume ?? 0) > 0
        ? ((item.planned_volume ?? 0) - cumulativeDelivered) / (item.planned_volume ?? 1)
        : null;

    const materialNameWithUnit = item.unit ? `${item.item_name} (${item.unit})` : item.item_name;
    const keterangan = "Untuk Tagihan Sesuai Dengan Volume Penerimaan";

    if (plafondVol !== null) sumPlafond += plafondVol;
    sumOrderVol += orderVol;
    sumLatestReceiptVol += latestReceiptVol;
    sumCumulativeDelivered += cumulativeDelivered;
    if (sisaPlafond !== null) sumSisaPlafond += sisaPlafond;
    if (contractVol !== null) sumContractVol += contractVol;

    row.values = [
      index + 1,
      materialNameWithUnit,
      plafondVol !== null ? plafondVol : "-",
      orderDateStr,
      orderVol > 0 ? orderVol : "-",
      receiptDateStr,
      latestReceiptVol > 0 ? latestReceiptVol : "-",
      cumulativeDelivered > 0 ? cumulativeDelivered : "-",
      sisaPlafond !== null ? sisaPlafond : "-",
      contractVol !== null ? contractVol : "-",
      sisaKontrakPct !== null ? sisaKontrakPct : "-",
      keterangan,
    ];

    const isEven = index % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = BORDER_ALL_LIGHT;
      cell.font = { name: FORMAL_STYLE.fontFamily, size: 9 };
      if (isEven) {
        cell.fill = { fgColor: { argb: FORMAL_STYLE.zebraBg }, pattern: "solid", type: "pattern" };
      }

      if (colNumber === 1 || colNumber === 4 || colNumber === 6) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 2 || colNumber === 12) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }

      // Quantity number formatting
      if (
        (colNumber === 3 ||
          colNumber === 5 ||
          colNumber === 7 ||
          colNumber === 8 ||
          colNumber === 9 ||
          colNumber === 10) &&
        typeof cell.value === "number"
      ) {
        cell.numFmt = "#,##0.00;(#,##0.00);-";
      }

      // Percentage formatting
      if (colNumber === 11 && typeof cell.value === "number") {
        cell.numFmt = "0.00%;(0.00%);-";
      }
    });
  });

  // Total Row
  const totalRowIdx = data.length + 6;
  const totalRow = ws.getRow(totalRowIdx);
  const totalSisaKontrakPct = sumContractVol > 0 ? (sumContractVol - sumCumulativeDelivered) / sumContractVol : null;

  totalRow.values = [
    "",
    "TOTAL",
    sumPlafond > 0 ? sumPlafond : "-",
    "",
    sumOrderVol > 0 ? sumOrderVol : "-",
    "",
    sumLatestReceiptVol > 0 ? sumLatestReceiptVol : "-",
    sumCumulativeDelivered > 0 ? sumCumulativeDelivered : "-",
    sumSisaPlafond,
    sumContractVol > 0 ? sumContractVol : "-",
    totalSisaKontrakPct !== null ? totalSisaKontrakPct : "-",
    "",
  ];

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true, color: { argb: FORMAL_STYLE.totalRowText }, name: FORMAL_STYLE.fontFamily, size: 9 };
    cell.fill = { fgColor: { argb: FORMAL_STYLE.totalRowBg }, pattern: "solid", type: "pattern" };
    cell.border = BORDER_ACCOUNTING_TOTAL;

    if (colNumber === 2) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    } else if (
      (colNumber === 3 ||
        colNumber === 5 ||
        colNumber === 7 ||
        colNumber === 8 ||
        colNumber === 9 ||
        colNumber === 10) &&
      typeof cell.value === "number"
    ) {
      cell.numFmt = "#,##0.00;(#,##0.00);-";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 11 && typeof cell.value === "number") {
      cell.numFmt = "0.00%;(0.00%);-";
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  // AutoFilter
  ws.autoFilter = "A5:L5";

  // ── LEMBAR PENGESAHAN / TANDA TANGAN (STANDAR FORMAL INSTANSI) ───────────────
  let curRow = totalRowIdx + 3;
  ws.getCell(`B${curRow}`).value = "Mengetahui / Menyetujui,";
  ws.getCell(`B${curRow}`).font = { bold: true, name: FORMAL_STYLE.fontFamily, size: 10 };

  ws.getCell(`I${curRow}`).value = "Dibuat Oleh,";
  ws.getCell(`I${curRow}`).font = { bold: true, name: FORMAL_STYLE.fontFamily, size: 10 };

  curRow++;
  ws.getCell(`B${curRow}`).value = "Pejabat Pembuat Komitmen / Manajer Proyek";
  ws.getCell(`B${curRow}`).font = { italic: true, name: FORMAL_STYLE.fontFamily, size: 9.5 };

  ws.getCell(`I${curRow}`).value = "Tim Pengadaan / Logistik Proyek";
  ws.getCell(`I${curRow}`).font = { italic: true, name: FORMAL_STYLE.fontFamily, size: 9.5 };

  curRow += 4;
  ws.getCell(`B${curRow}`).value = "( ........................................................... )";
  ws.getCell(`B${curRow}`).font = { bold: true, name: FORMAL_STYLE.fontFamily, size: 10 };

  ws.getCell(`I${curRow}`).value = "( ........................................................... )";
  ws.getCell(`I${curRow}`).font = { bold: true, name: FORMAL_STYLE.fontFamily, size: 10 };

  curRow++;
  ws.getCell(`B${curRow}`).value = "NIP/NIK. ";
  ws.getCell(`B${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 9 };

  ws.getCell(`I${curRow}`).value = "NIP/NIK. ";
  ws.getCell(`I${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 9 };
}
