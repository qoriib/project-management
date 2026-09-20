import { useMemo } from "react";
import type { RequirementReportItem } from "@/db/services";
import type { EnrichedReportItem } from "./useReportSummaryColumns";

export interface UseReportSummaryGroupedDataResult {
  enrichedReport: EnrichedReportItem[];
  groupOrder: string[];
  paguGroupNames: Set<string>;
}

/**
 * Custom hook untuk mengelompokkan data laporan pemenuhan kebutuhan berdasarkan kelompok pekerjaan:
 * - Menghitung subtotal akumulasi pemesanan (PO) vs perencanaan (BOQ).
 * - Mengurutkan kelompok berbasis UUIDv7 ASC.
 * - Mengumpulkan daftar kelompok pagu dan urutan kelompok dalam single-pass O(N).
 */
export function useReportSummaryGroupedData(report: RequirementReportItem[]): UseReportSummaryGroupedDataResult {
  return useMemo(() => {
    const groupMap = new Map<string, RequirementReportItem[]>();
    const paguGroupNames = new Set<string>();

    for (const row of report) {
      const groupId = row.requirement_group_id ?? "none";
      let groupItems = groupMap.get(groupId);
      if (!groupItems) {
        groupItems = [];
        groupMap.set(groupId, groupItems);
      }
      groupItems.push(row);

      const hasValidBudget = row.group_budget != null && row.group_budget > 0;
      if (row.group_name && hasValidBudget) {
        paguGroupNames.add(row.group_name);
      }
    }

    const sortedGroupIds = Array.from(groupMap.keys()).toSorted((a, b) => a.localeCompare(b));
    const enrichedReport: EnrichedReportItem[] = [];
    const groupOrder: string[] = [];

    for (const groupId of sortedGroupIds) {
      const items = groupMap.get(groupId)!;
      const groupBudget =
        items.find((item) => item.group_budget != null && item.group_budget > 0)?.group_budget ?? null;
      const isPaguGroup = groupBudget != null && groupBudget > 0;

      let subVolumeReceipt = 0;
      let subVolumeOrder = 0;
      let subVolumePlan = 0;
      let subDppReceipt = 0;
      let subDppOrder = 0;
      let subDppPlan = 0;
      let subTaxReceipt = 0;
      let subTaxOrder = 0;
      let subTaxPlan = 0;
      let subPriceReceipt = 0;
      let subPriceOrder = 0;
      let subBudgetPlan = 0;
      let groupName = "";

      for (const item of items) {
        if (!groupName && item.group_name) {
          groupName = item.group_name;
          groupOrder.push(groupName);
        }

        enrichedReport.push({
          ...item,
          unique_id: `${item.requirement_group_id ?? "none"}__${item.item_id}`,
        });

        if (item.is_empty_group) continue;

        subVolumeReceipt += item.total_delivered || 0;
        subVolumeOrder += item.total_ordered || 0;
        subVolumePlan += item.planned_volume || 0;
        subDppReceipt += item.total_receipt_dpp || 0;
        subDppOrder += item.total_order_dpp || 0;
        subDppPlan += item.planned_dpp || 0;
        subTaxReceipt += item.total_receipt_tax || 0;
        subTaxOrder += item.total_order_tax || 0;
        subTaxPlan += item.planned_tax || 0;
        subPriceReceipt += item.total_receipt_price || 0;
        subPriceOrder += item.total_order_price || 0;
        subBudgetPlan += item.planned_budget || 0;
      }

      const plannedBudgetForSubtotal = isPaguGroup ? groupBudget : subBudgetPlan;
      const plannedDppForSubtotal = isPaguGroup ? 0 : subDppPlan;
      const plannedTaxForSubtotal = isPaguGroup ? 0 : subTaxPlan;

      // Subtotal footer row per kelompok pekerjaan
      enrichedReport.push({
        category: "-",
        group_name: groupName,
        group_budget: groupBudget,
        is_group_footer: true,
        item_code: "",
        item_id: `subtotal_${groupId}`,
        item_name: `Subtotal ${groupName}`,
        order_variants: [],
        planned_budget: plannedBudgetForSubtotal,
        planned_dpp: plannedDppForSubtotal,
        planned_tax: plannedTaxForSubtotal,
        planned_variants: [],
        planned_volume: subVolumePlan,
        receipt_variants: [],
        requirement_group_id: groupId,
        total_delivered: subVolumeReceipt,
        total_order_dpp: subDppOrder,
        total_order_price: subPriceOrder,
        total_order_tax: subTaxOrder,
        total_ordered: subVolumeOrder,
        total_receipt_dpp: subDppReceipt,
        total_receipt_price: subPriceReceipt,
        total_receipt_tax: subTaxReceipt,
        unique_id: `subtotal_${groupId}`,
        unit: "-",
      });
    }

    return { enrichedReport, groupOrder, paguGroupNames };
  }, [report]);
}
