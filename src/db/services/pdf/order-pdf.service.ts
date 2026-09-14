/**
 * Order PDF Service — Lapisan data pembuatan dokumen PDF dari record Pengadaan (Order).
 *
 * Dua template yang tersedia:
 * 1. Purchase Order (satu dokumen per vendor, dipilih manual saat ekspor)
 * 2. Form Permintaan Barang/Alat / Asset Control (seluruh item dalam satu order)
 *
 * Field placeholder (catatan, no. dokumen, dsb.) hanya untuk kebutuhan cetak
 * dan tidak tersimpan ke database.
 */

import { NotFoundError, wrapDbError } from "@/db/core/errors";
import { projectRepo, orderRepo } from "@/db/repositories";
import { formatNumber, formatDate } from "@/utils/formatters";
import { createPurchaseOrderPdf } from "./purchase-order-pdf";
import { createAssetRequestPdf } from "./asset-request-pdf";
import type {
  AssetRequestPdfContext,
  GenerateAssetRequestOptions,
  GeneratePurchaseOrderOptions,
  OrderPdfItem,
  PurchaseOrderPdfContext,
} from "./order-pdf-types";

/** Format harga satuan mengikuti pola dokumen fisik (e.g. "@Rp. 280.000,-"). */
function formatPriceSuffix(price: number | undefined | null): string {
  if (price === undefined || price === null || isNaN(price)) {
    return "";
  }
  return ` @Rp. ${formatNumber(price, 0)},-`;
}

export { formatPriceSuffix };

/**
 * Membuat dokumen PDF Purchase Order untuk satu vendor dari satu order.
 *
 * @param orderId - ID record order sumber
 * @param options - vendorId wajib; orderCodeOverride & note opsional (input manual saat ekspor)
 * @returns Uint8Array konten dokumen PDF
 */
export async function generatePurchaseOrderPdf(
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
        qty_display: `${formatNumber(item.qty, 2)}${unitStr}`.trim(),
        unit: item.unit ?? "",
      };
    });

    const context: PurchaseOrderPdfContext = {
      title: "PURCHASE ORDER",
      order_code: options.orderCodeOverride?.trim() || order.order_code || "-",
      order_date_display: formatDate(order.order_date),
      vendor_name: vendorName,
      package_name: project?.project_name ?? "-",
      year: project?.fiscal_year ?? "-",
      company_name: project?.company_name ?? "-",
      items: pdfItems,
      note: options.note?.trim() ?? "",
      preprintedOnly: options.preprintedOnly ?? true,
    };

    const doc = createPurchaseOrderPdf(context);
    return new Uint8Array(doc.output("arraybuffer"));
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw wrapDbError(error, "purchase_order_pdf");
  }
}

/**
 * Membuat dokumen PDF Form Permintaan Barang/Alat (Asset Control)
 * dari seluruh item dalam satu order (tanpa pengelompokan vendor).
 *
 * @param orderId - ID record order sumber
 * @param options - documentCode diisi manual saat ekspor (placeholder, tidak disimpan)
 * @returns Uint8Array konten dokumen PDF
 */
export async function generateAssetRequestPdf(
  orderId: string,
  options: GenerateAssetRequestOptions,
): Promise<Uint8Array> {
  try {
    const order = await orderRepo.findByIdWithSummary(orderId);
    if (!order) {
      throw new NotFoundError("orders", orderId);
    }

    const items = await orderRepo.findItems(orderId);
    const project = await projectRepo.findById(order.project_id);

    const pdfItems: OrderPdfItem[] = items.map((item, index) => ({
      no: index + 1,
      name_with_price: item.item_name ?? "-",
      qty_display: formatNumber(item.qty, 2),
      unit: item.unit ?? "-",
      item_code: item.item_code ?? "-",
    }));

    const now = new Date();

    const context: AssetRequestPdfContext = {
      company_line: "CIVIL ENGINEERING & GENERAL CONTRACTORS",
      company_name: project?.company_name ?? "-",
      project_name: project?.project_name ?? "-",
      fiscal_year: project?.fiscal_year ?? "-",
      document_code: options.documentCode?.trim() || "....................",
      items: pdfItems,
      location: "Bandar Lampung",
      date_display: formatDate(now),
      remarks: options.remarks?.trim() ?? "",
    };

    const doc = createAssetRequestPdf(context);
    return new Uint8Array(doc.output("arraybuffer"));
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw wrapDbError(error, "asset_request_pdf");
  }
}
