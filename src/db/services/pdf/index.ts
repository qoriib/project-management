import { projectRepo } from "@/db/repositories";
import { formatPeriod } from "@/utils/formatters";
import type { RequirementReportItem } from "../report.service";
import { getItemLog, getRequirementReport } from "../report.service";
import { createFulfillmentVolumePdf } from "./fulfillment-pdf";
import type { FulfillmentPdfItem, ItemTransactionHistory } from "./types";

export * from "./types";
export * from "./styles";
export * from "./utils";
export * from "./fulfillment-table";
export * from "./transaction-history-table";
export * from "./fulfillment-pdf";

/**
 * Generates a focused Landscape PDF report of BOM vs PO vs Delivery Volume,
 * followed by a Portrait section detailing transaction history per item.
 */
export async function generateFulfillmentVolumePdf(
  projectId: string,
  startDate?: string,
  endDate?: string,
): Promise<Uint8Array> {
  const hasDateRange = Boolean(startDate);

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
    const pItem = periodData.find((p) => p.item_id === item.item_id);
    const cItem = cumulativeData ? cumulativeMap.get(item.item_id) : item;

    const periodOrdered = pItem?.total_ordered ?? 0;
    const cumulativeOrdered = cItem?.total_ordered ?? periodOrdered;

    const periodDelivered = pItem?.total_delivered ?? 0;
    const cumulativeDelivered = cItem?.total_delivered ?? periodDelivered;

    return {
      ...item,
      period_ordered: periodOrdered,
      cumulative_ordered: cumulativeOrdered,
      period_delivered: periodDelivered,
      cumulative_delivered: cumulativeDelivered,
    };
  });

  // Ambil riwayat transaksi untuk item yang memiliki pergerakan pemesanan atau penerimaan
  const itemsWithActivity = fulfillmentData.filter(
    (item) =>
      (item.cumulative_ordered ?? item.total_ordered ?? 0) > 0 ||
      (item.cumulative_delivered ?? item.total_delivered ?? 0) > 0 ||
      Boolean(item.is_unplanned),
  );

  const rawItemLogs = await Promise.all(
    itemsWithActivity.map(async (item) => {
      try {
        const logs = await getItemLog(projectId, item.item_id);
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

  const doc = createFulfillmentVolumePdf({
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
