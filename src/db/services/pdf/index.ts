import { projectRepo } from "@/db/repositories";
import { formatPeriod } from "@/utils/formatters";
import { getItemLog, getRequirementReport, type RequirementReportItem } from "../report";
import { createReportPdf } from "./report-pdf";
import type { FulfillmentPdfItem, ItemTransactionHistory } from "./types";

export * from "./types";
export * from "./order-pdf-types";
export * from "./styles";
export * from "./utils";
export * from "./fulfillment-table";
export * from "./transaction-history-table";
export * from "./report-pdf";
export * from "./order-pdf.service";

/**
 * Menghasilkan dokumen PDF laporan formal (Lanskap: Pemenuhan Volume, Potret: Riwayat Transaksi per Item).
 */
export async function generateReportPdf(projectId: string, startDate?: string, endDate?: string): Promise<Uint8Array> {
  const hasDateRange = Boolean(startDate || endDate);

  const [projectRecord, periodData, cumulativeData] = await Promise.all([
    projectRepo.findById(projectId),
    getRequirementReport(projectId, startDate, endDate),
    hasDateRange ? getRequirementReport(projectId, undefined, endDate) : null,
  ]);

  const cumulativeMap = new Map<string, RequirementReportItem>();

  if (cumulativeData) {
    for (const item of cumulativeData) {
      cumulativeMap.set(item.item_id, item);
    }
  }

  const baseList = cumulativeData || periodData;

  const fulfillmentData: FulfillmentPdfItem[] = baseList.map((item) => {
    const periodItem = periodData.find((periodRow) => periodRow.item_id === item.item_id);
    const cumulativeItem = cumulativeData ? cumulativeMap.get(item.item_id) : item;

    const periodOrdered = periodItem?.total_ordered ?? 0;
    const cumulativeOrdered = cumulativeItem?.total_ordered ?? periodOrdered;

    const periodDelivered = periodItem?.total_delivered ?? 0;
    const cumulativeDelivered = cumulativeItem?.total_delivered ?? periodDelivered;

    return {
      ...item,
      period_ordered: periodOrdered,
      cumulative_ordered: cumulativeOrdered,
      period_delivered: periodDelivered,
      cumulative_delivered: cumulativeDelivered,
    };
  });

  // Ambil riwayat transaksi untuk item yang memiliki pergerakan pengadaan atau penerimaan
  const itemsWithActivity = fulfillmentData.filter(
    (item) =>
      (item.cumulative_ordered ?? item.total_ordered ?? 0) > 0 ||
      (item.cumulative_delivered ?? item.total_delivered ?? 0) > 0 ||
      Boolean(item.is_unplanned),
  );

  const rawItemLogs = await Promise.all(
    itemsWithActivity.map(async (item) => {
      try {
        const logs = await getItemLog(projectId, item.item_id, item.requirement_group_id ?? null);

        let filteredLogs = logs;

        if (startDate) {
          filteredLogs = filteredLogs.filter((log) => log.date >= startDate);
        }

        if (endDate) {
          filteredLogs = filteredLogs.filter((log) => log.date <= endDate);
        }

        return { item, logs: filteredLogs };
      } catch {
        return { item, logs: [] };
      }
    }),
  );

  const itemLogs: ItemTransactionHistory[] = rawItemLogs.filter((entry) => entry.logs.length > 0);

  const projectName = projectRecord?.project_name ?? "Proyek";
  const companyName = projectRecord?.company_name ?? "Perusahaan";
  const formattedPeriod = formatPeriod(startDate, endDate);

  const doc = createReportPdf({
    project_name: projectName,
    company_name: companyName,
    period: formattedPeriod,
    data: fulfillmentData,
    itemLogs,
    hasDateRange,
  });

  const arrayBuffer = doc.output("arraybuffer");

  return new Uint8Array(arrayBuffer);
}
