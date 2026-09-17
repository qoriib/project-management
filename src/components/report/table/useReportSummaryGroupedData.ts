import { useMemo } from "react";
import type { RequirementReportItem } from "@/db/services";
import type { EnrichedReportItem } from "./useReportSummaryColumns";

interface UseReportSummaryGroupedDataResult {
  enrichedReport: EnrichedReportItem[];
  groupOrder: string[];
}

/**
 * Custom hook untuk mengelompokkan data laporan pemenuhan kebutuhan berdasarkan kelompok pekerjaan:
 * - Menghitung subtotal akumulasi pemesanan (PO) vs perencanaan (BOQ).
 * - Mengurutkan kelompok berbasis UUIDv7 ASC.
 */
export function useReportSummaryGroupedData(report: RequirementReportItem[]): UseReportSummaryGroupedDataResult {
  const enrichedReport: EnrichedReportItem[] = useMemo(() => {
    const groupMap = new Map<string, RequirementReportItem[]>();
    for (const r of report) {
      const gId = r.requirement_group_id ?? "none";
      const list = groupMap.get(gId) || [];
      list.push(r);
      groupMap.set(gId, list);
    }

    const sortedGroupIds = Array.from(groupMap.keys()).toSorted((a, b) => a.localeCompare(b));
    const result: EnrichedReportItem[] = [];

    for (const gId of sortedGroupIds) {
      const items = groupMap.get(gId) || [];
      const isSingleEmpty = items.length === 1 && Boolean(items[0].is_empty_group);
      const isPaguGroup = items.some((it) => it.group_budget && it.group_budget > 0);

      if (isSingleEmpty && !isPaguGroup) {
        result.push({
          ...items[0],
          unique_id: `${items[0].requirement_group_id ?? "none"}__${items[0].item_id}`,
        });
        continue;
      }

      let subVolumeOrder = 0;
      let subVolumePlan = 0;
      let subDppOrder = 0;
      let subDppPlan = 0;
      let subTaxOrder = 0;
      let subTaxPlan = 0;
      let subPriceOrder = 0;
      let subBudgetPlan = 0;
      let groupName = "";

      for (const item of items) {
        if (!groupName && item.group_name) groupName = item.group_name;
        if (item.is_empty_group) continue;

        result.push({
          ...item,
          unique_id: `${item.requirement_group_id ?? "none"}__${item.item_id}`,
        });

        subVolumeOrder += item.total_ordered || 0;
        subVolumePlan += item.planned_volume || 0;
        subDppOrder += item.total_order_dpp || 0;
        subDppPlan += item.planned_dpp || 0;
        subTaxOrder += item.total_order_tax || 0;
        subTaxPlan += item.planned_tax || 0;
        subPriceOrder += item.total_order_price || 0;
        subBudgetPlan += item.planned_budget || 0;
      }

      const groupBudget = items.find((it) => it.group_budget && it.group_budget > 0)?.group_budget ?? null;
      const plannedBudgetForSubtotal = groupBudget && groupBudget > 0 ? groupBudget : subBudgetPlan;
      const plannedDppForSubtotal = groupBudget && groupBudget > 0 ? groupBudget : subDppPlan;
      const plannedTaxForSubtotal = groupBudget && groupBudget > 0 ? 0 : subTaxPlan;

      // Subtotal footer row per kelompok pekerjaan
      result.push({
        category: "-",
        group_name: groupName,
        group_budget: groupBudget,
        is_group_footer: true,
        item_code: "",
        item_id: `subtotal_${gId}`,
        item_name: `Subtotal ${groupName}`,
        order_variants: [],
        planned_budget: plannedBudgetForSubtotal,
        planned_dpp: plannedDppForSubtotal,
        planned_tax: plannedTaxForSubtotal,
        planned_variants: [],
        planned_volume: subVolumePlan,
        requirement_group_id: gId,
        total_delivered: 0,
        total_order_dpp: subDppOrder,
        total_order_price: subPriceOrder,
        total_order_tax: subTaxOrder,
        total_ordered: subVolumeOrder,
        unique_id: `subtotal_${gId}`,
        unit: "-",
      });
    }

    return result;
  }, [report]);

  const groupOrder = useMemo(() => {
    const list: string[] = [];
    const sorted = report.toSorted((a, b) =>
      (a.requirement_group_id || "").localeCompare(b.requirement_group_id || ""),
    );
    for (const item of sorted) {
      if (item.group_name && !list.includes(item.group_name)) {
        list.push(item.group_name);
      }
    }
    return list;
  }, [report]);

  return { enrichedReport, groupOrder };
}
