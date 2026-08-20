import * as ExcelJS from "exceljs";
import { getRequirementReport, getProjectOrderReport, getProjectReceiptReport } from "./report.service";

/**
 * Generates an Excel report for Requirement Fulfillment.
 * Returns a Uint8Array representing the .xlsx file content.
 */
export async function generateRequirementReportExcel(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<Uint8Array> {
  const [data, orderData, receiptData] = await Promise.all([
    getRequirementReport(projectId, startDate, endDate),
    getProjectOrderReport(projectId, startDate, endDate),
    getProjectReceiptReport(projectId, startDate, endDate),
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
    { header: "KODE ITEM", key: "item_code", width: 15 },
    { header: "NAMA ITEM", key: "item_name", width: 35 },
    { header: "KATEGORI", key: "category", width: 20 },
    { header: "SATUAN", key: "unit", width: 15 },
    { header: "HARGA SATUAN", key: "price", width: 20, style: { numFmt: '#,##0.00' } },
    { header: "QTY RENCANA", key: "planned_volume", width: 15, style: { numFmt: '#,##0.00' } },
    { header: "ANGGARAN RENCANA", key: "planned_budget", width: 25, style: { numFmt: '#,##0.00' } },
    { header: "QTY DIPESAN", key: "total_ordered", width: 20, style: { numFmt: '#,##0.00' } },
    { header: "TOTAL DIPESAN", key: "total_order_price", width: 25, style: { numFmt: '#,##0.00' } },
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
      item_code: item.item_code,
      item_name: item.item_name,
      category: item.category,
      unit: item.unit,
      price: item.price,
      planned_volume: item.planned_volume,
      planned_budget: item.planned_budget,
      total_ordered: item.total_ordered,
      total_order_price: item.total_order_price,
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
      if (colNumber === 1 || colNumber === 3 || colNumber === 4) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else if (colNumber === 2) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "right" }; // Numbers
      }
    });
  });

  // Auto filter for DETAIL
  worksheet.autoFilter = {
    from: 'A1',
    to: 'J1',
  };

  // 3. Create Order Worksheet
  const wsOrder = workbook.addWorksheet("PESANAN", {
    headerFooter: {
      firstHeader: "LAPORAN PESANAN BARANG",
    },
  });

  wsOrder.columns = [
    { header: "TANGGAL PESANAN", key: "order_date", width: 15 },
    { header: "NOMOR PESANAN", key: "order_code", width: 20 },
    { header: "NAMA VENDOR", key: "vendor_name", width: 25 },
    { header: "KODE ITEM", key: "item_code", width: 15 },
    { header: "NAMA ITEM", key: "item_name", width: 35 },
    { header: "KATEGORI", key: "category_name", width: 20 },
    { header: "SATUAN", key: "unit_name", width: 15 },
    { header: "QTY", key: "qty", width: 15, style: { numFmt: '#,##0.00' } },
    { header: "HARGA SATUAN", key: "price", width: 20, style: { numFmt: '#,##0.00' } },
    { header: "TOTAL HARGA", key: "total_price", width: 20, style: { numFmt: '#,##0.00' } },
  ];

  const headerRowOrder = wsOrder.getRow(1);
  headerRowOrder.height = 30;
  headerRowOrder.font = { bold: true, color: { argb: "FF000000" }, size: 12 };
  headerRowOrder.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRowOrder.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  orderData.forEach((item) => {
    const row = wsOrder.addRow(item);
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

  wsOrder.autoFilter = { from: 'A1', to: 'J1' };

  // 4. Create Receipt Worksheet
  const wsReceipt = workbook.addWorksheet("PENERIMAAN", {
    headerFooter: {
      firstHeader: "LAPORAN PENERIMAAN BARANG",
    },
  });

  wsReceipt.columns = [
    { header: "TANGGAL PENERIMAAN", key: "receipt_date", width: 15 },
    { header: "NOMOR PENERIMAAN", key: "receipt_code", width: 20 },
    { header: "NOMOR PESANAN", key: "order_code", width: 20 },
    { header: "NAMA VENDOR", key: "vendor_name", width: 25 },
    { header: "KODE ITEM", key: "item_code", width: 15 },
    { header: "NAMA ITEM", key: "item_name", width: 35 },
    { header: "KATEGORI", key: "category_name", width: 20 },
    { header: "SATUAN", key: "unit_name", width: 15 },
    { header: "QTY DITERIMA", key: "qty", width: 20, style: { numFmt: '#,##0.00' } },
  ];

  const headerRowReceipt = wsReceipt.getRow(1);
  headerRowReceipt.height = 30;
  headerRowReceipt.font = { bold: true, color: { argb: "FF000000" }, size: 12 };
  headerRowReceipt.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRowReceipt.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  receiptData.forEach((item) => {
    const row = wsReceipt.addRow(item);
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

  wsReceipt.autoFilter = { from: 'A1', to: 'I1' };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
