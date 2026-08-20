import type * as ExcelJS from "exceljs";
import type { ExecutiveSummaryContext } from "./types";
import { FORMAL_STYLE, BORDER_ALL_LIGHT, BORDER_ALL_THIN, BORDER_ACCOUNTING_TOTAL } from "./styles";

/**
 * Creates the executive summary sheet (Ringkasan Eksekutif & Pengesahan).
 */
export function createExecutiveSummarySheet(workbook: ExcelJS.Workbook, context: ExecutiveSummaryContext): void {
  const { project_name, company_name, fiscal_year, period, data, orderData, receiptData } = context;
  const ws = workbook.addWorksheet("RINGKASAN", {
    views: [{ showGridLines: true }],
  });

  ws.columns = [
    { width: 4 }, // A (margin)
    { width: 30 }, // B
    { width: 22 }, // C
    { width: 26 }, // D
    { width: 26 }, // E
    { width: 18 }, // F
    { width: 18 }, // G
  ];

  // ── KOP FORMAL INSTANSI ───────────────────────────────────────────────────
  ws.mergeCells("B2:G2");
  const kop1 = ws.getCell("B2");
  kop1.value = company_name.toUpperCase();
  kop1.font = { name: FORMAL_STYLE.fontFamily, size: 12, bold: true, color: { argb: "FF1F4E78" } };
  kop1.alignment = { vertical: "middle", horizontal: "center" };

  ws.mergeCells("B3:G3");
  const kop2 = ws.getCell("B3");
  kop2.value = "LAPORAN PERTANGGUNGJAWABAN PENGADAAN & REALISASI ANGGARAN";
  kop2.font = { name: FORMAL_STYLE.fontFamily, size: 14, bold: true, color: { argb: "FF000000" } };
  kop2.alignment = { vertical: "middle", horizontal: "center" };

  ws.mergeCells("B4:G4");
  const kop3 = ws.getCell("B4");
  kop3.value = `TAHUN ANGGARAN ${fiscal_year}`;
  kop3.font = { name: FORMAL_STYLE.fontFamily, size: 11, bold: true, color: { argb: "FF595959" } };
  kop3.alignment = { vertical: "middle", horizontal: "center" };

  for (let c = 2; c <= 7; c++) {
    ws.getRow(4).getCell(c).border = {
      bottom: { style: "medium", color: { argb: FORMAL_STYLE.borderDark } },
    };
  }

  // ── INFORMASI PROYEK ───────────────────────────────────────────────────────
  let curRow = 6;
  const infoRows = [
    ["Nama Proyek", `: ${project_name}`, "Periode Laporan", `: ${period}`],
    ["Instansi / Penyedia", `: ${company_name}`, "Tahun Anggaran", `: ${fiscal_year}`],
    [
      "Tanggal Unduh",
      `: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`,
      "Total Transaksi",
      `: ${orderData.length} Surat Pesanan (PO) / ${receiptData.length} Surat Jalan (NP)`,
    ],
  ];

  infoRows.forEach(([lbl1, val1, lbl2, val2]) => {
    ws.getCell(`B${curRow}`).value = lbl1;
    ws.getCell(`B${curRow}`).font = { name: FORMAL_STYLE.fontFamily, bold: true, size: 10 };

    ws.mergeCells(`C${curRow}:D${curRow}`);
    ws.getCell(`C${curRow}`).value = val1;
    ws.getCell(`C${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 10 };

    ws.getCell(`E${curRow}`).value = lbl2;
    ws.getCell(`E${curRow}`).font = { name: FORMAL_STYLE.fontFamily, bold: true, size: 10 };

    ws.mergeCells(`F${curRow}:G${curRow}`);
    ws.getCell(`F${curRow}`).value = val2;
    ws.getCell(`F${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 10 };

    ws.getRow(curRow).height = 19;
    curRow++;
  });

  // Calculate Metrics
  const totalPlannedBudget = data.reduce((sum, r) => sum + (r.planned_budget || 0), 0);
  const totalOrderPrice = data.reduce((sum, r) => sum + (r.total_order_price || 0), 0);
  const variance = totalOrderPrice - totalPlannedBudget;
  const variancePct = totalPlannedBudget > 0 ? variance / totalPlannedBudget : 0;
  const totalOrderedQty = data.reduce((sum, r) => sum + (r.total_ordered || 0), 0);
  const totalDeliveredQty = data.reduce((sum, r) => sum + (r.total_delivered || 0), 0);
  const fulfillmentRate = totalOrderedQty > 0 ? totalDeliveredQty / totalOrderedQty : 0;
  const totalPlannedItems = data.filter((r) => !r.is_unplanned).length;
  const totalUnplannedItems = data.filter((r) => r.is_unplanned).length;

  // ── TABEL 1: RINGKASAN KINERJA ANGGARAN & PENGADAAN ─────────────────────────
  curRow += 1;
  ws.mergeCells(`B${curRow}:G${curRow}`);
  const sec1 = ws.getCell(`B${curRow}`);
  sec1.value = "I. RINGKASAN KINERJA ANGGARAN & PENGADAAN";
  sec1.font = { name: FORMAL_STYLE.fontFamily, bold: true, size: 11, color: { argb: FORMAL_STYLE.primaryHeaderText } };
  sec1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.primaryHeaderBg } };
  sec1.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(curRow).height = 24;

  curRow++;
  const kpiData: [string, number, string, string][] = [
    ["1. Total Anggaran Rencana Kebutuhan (BOM)", totalPlannedBudget, "Rupiah (Rp)", "#,##0"],
    ["2. Total Realisasi Pemesanan Barang (PO)", totalOrderPrice, "Rupiah (Rp)", "#,##0"],
    ["3. Selisih / Deviasi Anggaran (PO - BOM)", variance, "Rupiah (Rp)", "#,##0"],
    ["4. Persentase Deviasi Terhadap Anggaran", variancePct, "Persen (%)", "0.00%"],
    ["5. Tingkat Pemenuhan Pengiriman Fisik (Fulfillment)", fulfillmentRate, "Persen (%)", "0.00%"],
    ["6. Jumlah Item Material Terencana (BOM)", totalPlannedItems, "Item Barang", "#,##0"],
    ["7. Jumlah Item Material Non-Rencana (Tambahan)", totalUnplannedItems, "Item Barang", "#,##0"],
  ];

  kpiData.forEach(([label, val, unit, fmt], idx) => {
    const row = ws.getRow(curRow);
    row.height = 20;

    ws.mergeCells(`B${curRow}:D${curRow}`);
    const lblCell = ws.getCell(`B${curRow}`);
    lblCell.value = label;
    lblCell.font = { name: FORMAL_STYLE.fontFamily, size: 10, bold: idx < 3 };
    lblCell.alignment = { vertical: "middle", horizontal: "left" };

    const valCell = ws.getCell(`E${curRow}`);
    valCell.value = val;
    valCell.numFmt = fmt;
    valCell.font = {
      name: FORMAL_STYLE.fontFamily,
      size: 10,
      bold: true,
      color:
        String(label).includes("Deviasi") && typeof val === "number"
          ? val > 0
            ? { argb: FORMAL_STYLE.statusRedText }
            : val < 0
              ? { argb: FORMAL_STYLE.statusGreenText }
              : { argb: "FF000000" }
          : { argb: "FF000000" },
    };
    valCell.alignment = { vertical: "middle", horizontal: "right" };

    ws.mergeCells(`F${curRow}:G${curRow}`);
    const unitCell = ws.getCell(`F${curRow}`);
    unitCell.value = unit;
    unitCell.font = { name: FORMAL_STYLE.fontFamily, size: 9.5, color: { argb: "FF595959" } };
    unitCell.alignment = { vertical: "middle", horizontal: "center" };

    for (let c = 2; c <= 7; c++) {
      row.getCell(c).border = BORDER_ALL_LIGHT;
      if (idx % 2 === 1) {
        row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.zebraBg } };
      }
    }
    curRow++;
  });

  // ── TABEL 2: REKAPITULASI REALISASI PER KELOMPOK / KATEGORI ────────────────
  curRow += 1;
  ws.mergeCells(`B${curRow}:G${curRow}`);
  const sec2 = ws.getCell(`B${curRow}`);
  sec2.value = "II. REKAPITULASI REALISASI ANGGARAN PER KATEGORI MATERIAL";
  sec2.font = { name: FORMAL_STYLE.fontFamily, bold: true, size: 11, color: { argb: FORMAL_STYLE.primaryHeaderText } };
  sec2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.primaryHeaderBg } };
  sec2.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(curRow).height = 24;

  curRow++;
  const catHeaders = [
    "KATEGORI MATERIAL",
    "JML ITEM",
    "ANGGARAN RENCANA (RP)",
    "REALISASI PESANAN (RP)",
    "DEVIASI / SELISIH (RP)",
    "% REALISASI",
  ];
  const catHRow = ws.getRow(curRow);
  catHRow.height = 24;
  catHeaders.forEach((h, i) => {
    const cell = catHRow.getCell(i + 2);
    cell.value = h;
    cell.font = { name: FORMAL_STYLE.fontFamily, bold: true, size: 9, color: { argb: FORMAL_STYLE.tableHeaderText } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.tableHeaderBg } };
    cell.border = BORDER_ALL_THIN;
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center", wrapText: true };
  });

  // Group data by category
  const catMap = new Map<
    string,
    {
      count: number;
      planned: number;
      ordered: number;
      qtyOrdered: number;
      qtyDelivered: number;
    }
  >();

  data.forEach((item) => {
    const cat = item.category || "LAINNYA";
    if (!catMap.has(cat)) {
      catMap.set(cat, { count: 0, planned: 0, ordered: 0, qtyOrdered: 0, qtyDelivered: 0 });
    }
    const rec = catMap.get(cat)!;
    rec.count += 1;
    rec.planned += item.planned_budget || 0;
    rec.ordered += item.total_order_price || 0;
    rec.qtyOrdered += item.total_ordered || 0;
    rec.qtyDelivered += item.total_delivered || 0;
  });

  const sortedCategories = Array.from(catMap.entries());
  sortedCategories.sort((a, b) => a[0].localeCompare(b[0]));

  curRow++;
  sortedCategories.forEach(([catName, stats], idx) => {
    const row = ws.getRow(curRow);
    row.height = 20;
    const catVariance = stats.ordered - stats.planned;
    const catRealizationPct = stats.planned > 0 ? stats.ordered / stats.planned : 0;

    const values = [catName, stats.count, stats.planned, stats.ordered, catVariance, catRealizationPct];

    values.forEach((val, i) => {
      const cell = row.getCell(i + 2);
      cell.value = val;
      cell.border = BORDER_ALL_LIGHT;
      cell.font = { name: FORMAL_STYLE.fontFamily, size: 9.5 };

      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.zebraBg } };
      }

      if (i === 0) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.font = { name: FORMAL_STYLE.fontFamily, size: 9.5, bold: true };
      } else if (i === 1) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.numFmt = "#,##0";
      } else if (i >= 2 && i <= 4) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = "#,##0";
        if (i === 4) {
          cell.font = {
            name: FORMAL_STYLE.fontFamily,
            size: 9.5,
            bold: true,
            color:
              catVariance > 0
                ? { argb: FORMAL_STYLE.statusRedText }
                : catVariance < 0
                  ? { argb: FORMAL_STYLE.statusGreenText }
                  : { argb: "FF000000" },
          };
        }
      } else if (i === 5) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
        cell.numFmt = "0.00%";
        cell.font = { name: FORMAL_STYLE.fontFamily, size: 9.5, bold: true };
      }
    });

    curRow++;
  });

  // Grand Total Row for Category Table
  const totalRow = ws.getRow(curRow);
  totalRow.height = 24;
  const totalVals = [
    "TOTAL KESELURUHAN",
    data.length,
    totalPlannedBudget,
    totalOrderPrice,
    variance,
    totalPlannedBudget > 0 ? totalOrderPrice / totalPlannedBudget : 0,
  ];

  totalVals.forEach((val, i) => {
    const cell = totalRow.getCell(i + 2);
    cell.value = val;
    cell.border = BORDER_ACCOUNTING_TOTAL;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: FORMAL_STYLE.totalRowBg } };
    cell.font = { name: FORMAL_STYLE.fontFamily, size: 10, bold: true, color: { argb: FORMAL_STYLE.totalRowText } };

    if (i === 0) {
      cell.alignment = { vertical: "middle", horizontal: "left" };
    } else if (i === 1) {
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.numFmt = "#,##0";
    } else if (i >= 2 && i <= 4) {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = "#,##0";
    } else if (i === 5) {
      cell.alignment = { vertical: "middle", horizontal: "right" };
      cell.numFmt = "0.00%";
    }
  });

  // ── LEMBAR PENGESAHAN / TANDA TANGAN (STANDAR FORMAL INSTANSI) ───────────────
  curRow += 3;
  ws.getCell(`B${curRow}`).value = "Mengetahui / Menyetujui,";
  ws.getCell(`B${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 10, bold: true };

  ws.getCell(`F${curRow}`).value = "Dibuat Oleh,";
  ws.getCell(`F${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 10, bold: true };

  curRow++;
  ws.getCell(`B${curRow}`).value = "Pejabat Pembuat Komitmen / Manajer Proyek";
  ws.getCell(`B${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 9.5, italic: true };

  ws.getCell(`F${curRow}`).value = "Tim Pengadaan / Logistik Proyek";
  ws.getCell(`F${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 9.5, italic: true };

  curRow += 4;
  ws.getCell(`B${curRow}`).value = "( ........................................................... )";
  ws.getCell(`B${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 10, bold: true };

  ws.getCell(`F${curRow}`).value = "( ........................................................... )";
  ws.getCell(`F${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 10, bold: true };

  curRow++;
  ws.getCell(`B${curRow}`).value = "NIP/NIK. ";
  ws.getCell(`B${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 9 };

  ws.getCell(`F${curRow}`).value = "NIP/NIK. ";
  ws.getCell(`F${curRow}`).font = { name: FORMAL_STYLE.fontFamily, size: 9 };
}
