import * as ExcelJS from "exceljs";
import { NotFoundError, wrapDbError } from "@/db/core/errors";
import { orderRepo, projectRepo } from "@/db/repositories";
import { formatDate, formatNumber } from "@/utils/formatters";
import { formatPriceSuffix } from "../pdf/order-pdf.service";
import type { GeneratePurchaseOrderOptions, OrderPdfItem } from "../pdf/order-pdf-types";

export interface PurchaseOrderExcelContext {
  order_code: string;
  order_date_display: string;
  vendor_name: string;
  package_name: string;
  group_name?: string;
  year: number | string;
  company_name: string;
  items: OrderPdfItem[];
  note: string;
}

/**
 * Membuat worksheet Excel untuk Purchase Order yang disesuaikan dengan format
 * blangko nota fisik (Gambar 4).
 *
 * Kolom:
 * - A: Margin kiri
 * - B: Info proyek bawah
 * - C: Nomor urut item (No.)
 * - D: Spasi
 * - E: Nama barang & catatan
 * - F: Jenis/Merk
 * - G: Header (No. PO, Tanggal, Vendor)
 * - H: Banyaknya (Qty + Satuan)
 */
export function createPurchaseOrderSheet(
  workbook: ExcelJS.Workbook,
  context: PurchaseOrderExcelContext,
): ExcelJS.Worksheet {
  const worksheet = workbook.addWorksheet("Purchase Order", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    },
    views: [{ showGridLines: true }],
  });

  // Konfigurasi lebar kolom presisi sesuai template nota fisik (Purchase Order Fix)
  worksheet.columns = [
    { key: "A", width: 5.11 },
    { key: "B", width: 1.33 },
    { key: "C", width: 4.55 }, // No. urut
    { key: "D", width: 3.89 },
    { key: "E", width: 36.33 }, // Nama barang & catatan
    { key: "F", width: 15 }, // Jenis/Merk
    { key: "G", width: 3.11 }, // No PO, Tanggal, Vendor (kolom awal)
    { key: "H", width: 23.11 }, // Banyaknya (Qty + Satuan) / span header
    { key: "I", width: 8.89 },
    { key: "J", width: 15.66 },
    { key: "K", width: 8.89 },
    { key: "L", width: 8.89 },
  ];

  const defaultFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 11,
    family: 2,
    color: { argb: "FF000000" },
  };

  // 1. Header Info (Kanan Atas, Baris 1-3)
  // G1: Nomor PO
  const cellG1 = worksheet.getCell("G1");
  cellG1.value = context.order_code;
  cellG1.font = defaultFont;

  // G2:H2 (merged): Tanggal PO
  worksheet.mergeCells("G2:H2");
  const cellG2 = worksheet.getCell("G2");
  cellG2.value = context.order_date_display;
  cellG2.font = defaultFont;
  cellG2.alignment = { horizontal: "left" };

  // G3:H3 (merged): Nama Vendor
  worksheet.mergeCells("G3:H3");
  const cellG3 = worksheet.getCell("G3");
  cellG3.value = context.vendor_name;
  cellG3.font = defaultFont;
  cellG3.alignment = { horizontal: "left" };

  // 2. Baris Item & Catatan (Mulai Baris 9)
  let currentRow = 9;

  for (const item of context.items) {
    const cellNo = worksheet.getCell(`C${currentRow}`);
    cellNo.value = item.no;
    cellNo.font = defaultFont;
    cellNo.alignment = { horizontal: "center" };

    const cellName = worksheet.getCell(`E${currentRow}`);
    cellName.value = item.name_with_price;
    cellName.font = defaultFont;

    const cellQty = worksheet.getCell(`H${currentRow}`);
    cellQty.value = item.qty_display;
    cellQty.font = defaultFont;

    currentRow += 1;
  }

  // Jika ada catatan, render per baris di kolom E tepat di bawah item
  if (context.note && context.note.trim()) {
    const rawLines = context.note.split(/\r?\n/);
    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      const cellNote = worksheet.getCell(`E${currentRow}`);
      cellNote.value = trimmed;
      cellNote.font = defaultFont;

      currentRow += 1;
    }
  }

  // Row 17 tinggi standar sesuai template
  worksheet.getRow(17).height = 15.6;

  // 3. Info Proyek (Kiri Bawah, Baris 20-22)
  const cellB20 = worksheet.getCell("B20");
  cellB20.value = context.package_name;
  cellB20.font = defaultFont;
  worksheet.getRow(20).height = 17.4;

  worksheet.mergeCells("B21:E21");
  const cellB21 = worksheet.getCell("B21");
  cellB21.value = String(context.year);
  cellB21.font = defaultFont;
  cellB21.alignment = { horizontal: "left" };

  const cellB22 = worksheet.getCell("B22");
  cellB22.value = context.company_name;
  cellB22.font = defaultFont;
  cellB22.alignment = { horizontal: "left" };

  return worksheet;
}

/**
 * Menghasilkan buffer file Excel (.xlsx) untuk Purchase Order per vendor.
 */
export async function generatePurchaseOrderExcel(
  orderId: string,
  options: GeneratePurchaseOrderOptions,
): Promise<Uint8Array> {
  try {
    const order = await orderRepo.findByIdWithSummary(orderId);
    if (!order) {
      throw new NotFoundError("orders", orderId);
    }

    const items = await orderRepo.findItems(orderId);
    const project = await projectRepo.findById(order.project_id);

    const vendorItems = items.filter((item) => item.vendor_id === options.vendorId);
    if (vendorItems.length === 0) {
      throw new NotFoundError("order_items_vendor", options.vendorId);
    }

    const vendorName = vendorItems[0]?.vendor_name ?? "-";

    const pdfItems: OrderPdfItem[] = vendorItems.map((item, index) => {
      const unitStr = item.unit ? ` ${item.unit}` : "";
      return {
        no: index + 1,
        name_with_price: `${item.item_name ?? "-"}${formatPriceSuffix(item.price)}`,
        qty_display: `${formatNumber(item.qty, "volume")}${unitStr}`.trim(),
        unit: item.unit ?? "",
      };
    });

    const groupName = order.group_name || vendorItems[0]?.group_name;
    const packageName = groupName ? `${project?.project_name ?? "-"} (${groupName})` : (project?.project_name ?? "-");

    const context: PurchaseOrderExcelContext = {
      order_code: options.orderCodeOverride?.trim() || order.order_code || "-",
      order_date_display: formatDate(order.order_date),
      vendor_name: vendorName,
      package_name: packageName,
      group_name: groupName ?? undefined,
      year: project?.fiscal_year ?? "-",
      company_name: project?.company_name ?? "-",
      items: pdfItems,
      note: options.note?.trim() ?? "",
    };

    const workbook = new ExcelJS.Workbook();
    createPurchaseOrderSheet(workbook, context);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw wrapDbError(error, "purchase_order_excel");
  }
}
