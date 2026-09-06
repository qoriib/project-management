import { projectRepo } from "@/db/repositories";
import { formatPeriod } from "@/utils/formatters";
import { getItemLog, getRequirementReport } from "../report.service";
import { createFulfillmentVolumePdf } from "./fulfillment-pdf";
import type { ItemTransactionHistory } from "./types";

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
  const [projectRecord, fulfillmentData] = await Promise.all([
    projectRepo.findById(projectId),
    getRequirementReport(projectId, startDate, endDate),
  ]);

  // Ambil riwayat transaksi untuk item yang memiliki pergerakan pemesanan atau penerimaan
  const itemsWithActivity = fulfillmentData.filter(
    (item) => (item.total_ordered ?? 0) > 0 || (item.total_delivered ?? 0) > 0 || Boolean(item.is_unplanned),
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
  });

  const arrayBuffer = doc.output("arraybuffer");

  return new Uint8Array(arrayBuffer);
}
