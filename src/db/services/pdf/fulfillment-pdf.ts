import jsPDF from "jspdf";
import { PDF_PAGE } from "./styles";
import type { FulfillmentPdfContext } from "./types";
import { renderFulfillmentVolumeSection } from "./fulfillment-table";
import { renderTransactionHistorySection } from "./transaction-history-table";
import { renderPdfFooter } from "./utils";

export type { FulfillmentPdfContext, ItemTransactionHistory, TransactionHistoryPdfContext } from "./types";

/**
 * Membuat dokumen PDF formal multi-halaman yang menggabungkan:
 * 1. Halaman Lanskap: Laporan Pemenuhan (Volume)
 * 2. Halaman Potret: Riwayat Transaksi per Item (Pemesanan & Penerimaan)
 * 3. Footer Dinamis: Penomoran halaman dan timestamp di seluruh orientasi
 */
export function createFulfillmentVolumePdf(context: FulfillmentPdfContext): jsPDF {
  const doc = new jsPDF({
    orientation: PDF_PAGE.orientation,
    unit: PDF_PAGE.unit,
    format: PDF_PAGE.format,
  });

  // 1. Render Bagian Laporan Pemenuhan Volume (Lanskap)
  renderFulfillmentVolumeSection(doc, context);

  // 2. Render Bagian Riwayat Transaksi per Item (Potret pada Halaman Baru)
  if (context.itemLogs && context.itemLogs.length > 0) {
    renderTransactionHistorySection(doc, {
      project_name: context.project_name,
      company_name: context.company_name,
      period: context.period,
      itemLogs: context.itemLogs,
    });
  }

  // 3. Render Footer Dinamis di Seluruh Halaman
  renderPdfFooter(doc);

  return doc;
}
