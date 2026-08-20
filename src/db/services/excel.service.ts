import * as ExcelJS from "exceljs";
import { getBOMReport, getProjectPOReport, getProjectDeliveryReport } from "./report.service";

/**
 * Generates an Excel report for BOM Fulfillment.
 * Returns a Uint8Array representing the .xlsx file content.
 */
export async function generateBOMReportExcel(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<Uint8Array> {
  const [data, poData, npData] = await Promise.all([
    getBOMReport(projectId, startDate, endDate),
    getProjectPOReport(projectId, startDate, endDate),
    getProjectDeliveryReport(projectId, startDate, endDate),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Project Management App";
  workbook.created = new Date();

  // Create Worksheet
  const worksheet = workbook.addWorksheet("DETAIL", {
    headerFooter: {
      firstHeader: "LAPORAN KEBUTUHAN & REALISASI (DETAIL)",
    },
  });

  // Define columns with Indonesian uppercase headers
  worksheet.columns = [
    { header: "GRUP", key: "bom_group_name", width: 25 },
    { header: "KODE ITEM", key: "item_code", width: 15 },
    { header: "NAMA ITEM", key: "item_name", width: 35 },
    { header: "KATEGORI", key: "category", width: 20 },
    { header: "SATUAN", key: "unit", width: 15 },
    { header: "HARGA SATUAN", key: "price", width: 20, style: { numFmt: '#,##0.00' } },
    { header: "QTY RENCANA", key: "planned_volume", width: 15, style: { numFmt: '#,##0.00' } },
    { header: "ANGGARAN RENCANA", key: "planned_budget", width: 25, style: { numFmt: '#,##0.00' } },
    { header: "QTY DIPESAN (PO)", key: "total_ordered", width: 20, style: { numFmt: '#,##0.00' } },
    { header: "TOTAL DIPESAN (PO)", key: "total_po_price", width: 25, style: { numFmt: '#,##0.00' } },
    { header: "QTY DITERIMA", key: "total_delivered", width: 20, style: { numFmt: '#,##0.00' } },
  ];

  // Style DETAIL header row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30; // make header taller
  headerRow.font = { bold: true, color: { argb: "FF000000" }, size: 12 };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F2F2" }, // light gray
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  // Add DETAIL data rows and apply border to each cell
  data.forEach((item) => {
    const row = worksheet.addRow({
      bom_group_name: item.bom_group_name || "-",
      item_code: item.item_code,
      item_name: item.item_name,
      category: item.category,
      unit: item.unit,
      price: item.price,
      planned_volume: item.planned_volume,
      planned_budget: item.planned_budget,
      total_ordered: item.total_ordered,
      total_po_price: item.total_po_price,
      total_delivered: item.total_delivered,
    });
    
    // add border and align center for text
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
      // Center alignment for some columns, left for names
      if (colNumber === 2 || colNumber === 4 || colNumber === 5) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else if (colNumber === 1 || colNumber === 3) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "right" }; // Numbers
      }
    });
  });

  // Auto filter for DETAIL
  worksheet.autoFilter = {
    from: 'A1',
    to: 'K1',
  };

  // 3. Create PO Worksheet
  const wsPO = workbook.addWorksheet("PO", {
    headerFooter: {
      firstHeader: "LAPORAN PURCHASE ORDER (PO)",
    },
  });

  wsPO.columns = [
    { header: "TANGGAL PO", key: "po_date", width: 15 },
    { header: "NOMOR PO", key: "po_code", width: 20 },
    { header: "NAMA VENDOR", key: "vendor_name", width: 25 },
    { header: "KODE ITEM", key: "item_code", width: 15 },
    { header: "NAMA ITEM", key: "item_name", width: 35 },
    { header: "KATEGORI", key: "category_name", width: 20 },
    { header: "SATUAN", key: "unit_name", width: 15 },
    { header: "QTY", key: "qty", width: 15, style: { numFmt: '#,##0.00' } },
    { header: "HARGA SATUAN", key: "price", width: 20, style: { numFmt: '#,##0.00' } },
    { header: "TOTAL HARGA", key: "total_price", width: 20, style: { numFmt: '#,##0.00' } },
  ];

  const headerRowPO = wsPO.getRow(1);
  headerRowPO.height = 30;
  headerRowPO.font = { bold: true, color: { argb: "FF000000" }, size: 12 };
  headerRowPO.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRowPO.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  poData.forEach((item) => {
    const row = wsPO.addRow(item);
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
      if (colNumber >= 8) {
        cell.alignment = { vertical: "middle", horizontal: "right" }; // Numbers
      } else if (colNumber === 4 || colNumber === 6 || colNumber === 7) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    });
  });

  wsPO.autoFilter = { from: 'A1', to: 'J1' };

  // 4. Create NP Worksheet
  const wsNP = workbook.addWorksheet("NP", {
    headerFooter: {
      firstHeader: "LAPORAN NOTA PENERIMAAN (NP)",
    },
  });

  wsNP.columns = [
    { header: "TANGGAL NP", key: "delivery_date", width: 15 },
    { header: "NOMOR NP", key: "delivery_code", width: 20 },
    { header: "NOMOR PO", key: "po_code", width: 20 },
    { header: "NAMA VENDOR", key: "vendor_name", width: 25 },
    { header: "KODE ITEM", key: "item_code", width: 15 },
    { header: "NAMA ITEM", key: "item_name", width: 35 },
    { header: "KATEGORI", key: "category_name", width: 20 },
    { header: "SATUAN", key: "unit_name", width: 15 },
    { header: "QTY DITERIMA", key: "qty", width: 20, style: { numFmt: '#,##0.00' } },
  ];

  const headerRowNP = wsNP.getRow(1);
  headerRowNP.height = 30;
  headerRowNP.font = { bold: true, color: { argb: "FF000000" }, size: 12 };
  headerRowNP.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRowNP.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  npData.forEach((item) => {
    const row = wsNP.addRow(item);
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
      if (colNumber === 9) {
        cell.alignment = { vertical: "middle", horizontal: "right" }; // Numbers
      } else if (colNumber === 5 || colNumber === 7 || colNumber === 8) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    });
  });

  wsNP.autoFilter = { from: 'A1', to: 'I1' };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
