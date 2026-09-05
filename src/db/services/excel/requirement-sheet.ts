import type * as ExcelJS from "exceljs";
import type { RequirementSheetContext } from "./types";
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
import { calcDPP, calcTax } from "@/utils/calc";

/**
 * Creates the Requirements registry sheet (Rincian Kebutuhan / BOM).
 */
export function createRequirementSheet(workbook: ExcelJS.Workbook, context: RequirementSheetContext): void {
  const { project_name, company_name, fiscal_year, period, requirementData } = context;
  const ws = workbook.addWorksheet("RINCIAN KEBUTUHAN", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 5, showGridLines: true }],
  });

  const COLUMNS: SheetColumnConfig[] = [
    { header: "NO", key: "no", width: 6 },
    { header: "KODE ITEM", key: "item_code", width: 16 },
    { header: "URAIAN BARANG / PEKERJAAN", key: "item_name", width: 36 },
    { header: "KATEGORI", key: "category_name", width: 16 },
    { header: "SATUAN", key: "unit_name", width: 10 },
    { header: "VOLUME", key: "qty", width: 14 },
    { header: "HARGA SATUAN (RP)", key: "price", width: 18 },
    { header: "SUBTOTAL (RP)", key: "dpp", width: 18 },
    { header: "PPN 12% (RP)", key: "tax_amount", width: 16 },
    { header: "TOTAL ANGGARAN (RP)", key: "total_price", width: 22 },
  ];

  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  createFormalKop(ws, {
    company_name,
    endCol: "J",
    endColIdx: 10,
    startCol: "A",
    startColIdx: 1,
    subtitle: `Proyek: ${project_name}  |  Tahun Anggaran: ${fiscal_year}  |  Periode: ${period}`,
    title: "BUKU REGISTER KEBUTUHAN ITEM (BILL OF QUANTITIES / BOM)",
  });

  renderTableHeaderRow(ws, COLUMNS, 5);

  let sumQty = 0;
  let sumDpp = 0;
  let sumTax = 0;
  let sumTotalPrice = 0;

  requirementData.forEach((item, index) => {
    const rowIdx = index + 6;
    const row = ws.getRow(rowIdx);

    const code = formatItemCode(item) || item.item_code || "-";
    const dpp = item.dpp || calcDPP(item.qty, item.price);
    const taxAmount = item.tax_amount || calcTax(dpp, item.has_tax);
    const totalPrice = item.total_price || dpp + taxAmount;

    sumQty += item.qty || 0;
    sumDpp += dpp;
    sumTax += taxAmount;
    sumTotalPrice += totalPrice;

    row.values = [
      index + 1,
      code,
      item.item_name,
      item.category_name || "-",
      item.unit_name || "-",
      item.qty || 0,
      item.price || 0,
      dpp,
      taxAmount,
      totalPrice,
    ];

    const isEven = index % 2 === 1;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = BORDER_ALL_LIGHT;
      cell.font = { name: FORMAL_STYLE.fontFamily, size: 9 };
      if (isEven) {
        cell.fill = { fgColor: { argb: FORMAL_STYLE.zebraBg }, pattern: "solid", type: "pattern" };
      }

      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 5) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 3) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "right", vertical: "middle" };
      }

      if (colNumber === 6) {
        cell.numFmt = EXCEL_NUM_FMT.quantity;
      }
      if (colNumber === 7 || colNumber === 8 || colNumber === 9 || colNumber === 10) {
        cell.numFmt = EXCEL_NUM_FMT.currency;
      }
    });
  });

  // Total Row
  const totalRowIdx = requirementData.length + 6;
  const totalRow = ws.getRow(totalRowIdx);
  totalRow.values = ["", "TOTAL KEBUTUHAN (BOM)", "", "", "", sumQty, "", sumDpp, sumTax, sumTotalPrice];

  ws.mergeCells(`B${totalRowIdx}:E${totalRowIdx}`);

  totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true, color: { argb: FORMAL_STYLE.totalRowText }, name: FORMAL_STYLE.fontFamily, size: 9 };
    cell.fill = { fgColor: { argb: FORMAL_STYLE.totalRowBg }, pattern: "solid", type: "pattern" };
    cell.border = BORDER_ACCOUNTING_TOTAL;

    if (colNumber === 2) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    } else if (colNumber === 6) {
      cell.numFmt = EXCEL_NUM_FMT.quantity;
      cell.alignment = { horizontal: "right", vertical: "middle" };
    } else if (colNumber === 8 || colNumber === 9 || colNumber === 10) {
      cell.numFmt = EXCEL_NUM_FMT.currency;
      cell.alignment = { horizontal: "right", vertical: "middle" };
    }
  });

  ws.autoFilter = "A5:J5";
}
