import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import { calcDPP, calcTax } from "@/utils/calc";
import type { RequirementReportDetailItem } from "./types";

/**
 * Gets all BOQ (requirement) items for a project formatted for export.
 */
export async function getProjectRequirementReport(projectId: string): Promise<RequirementReportDetailItem[]> {
  try {
    // price comes from requirements.price (snapshot)
    const query = new QueryBuilder()
      .select(
        "requirements.requirement_group_id",
        "requirement_groups.group_name",
        "items.item_code",
        "categories.prefix as category_prefix",
        "categories.category_code",
        "items.item_name",
        "categories.category_name",
        "units.unit_name",
        "requirements.qty",
        "item_prices.price as price",
        "requirements.has_tax",
      )
      .from("requirements", "requirements")
      .join("item_prices", "item_prices", "item_prices.item_price_id = requirements.item_price_id")
      .leftJoin(
        "requirement_groups",
        "requirement_groups",
        "requirement_groups.requirement_group_id = requirements.requirement_group_id",
      )
      .join("items", "items", "items.item_id = requirements.item_id")
      .leftJoin("item_categories", "categories", "categories.category_id = items.category_id")
      .leftJoin("units", "units", "units.unit_id = items.unit_id")
      .where("requirements.project_id", "=", projectId)
      .orderBy("COALESCE(requirement_groups.requirement_group_id, '')", "ASC")
      .orderBy("items.item_name", "ASC");

    const raw = await query.getMany<{
      requirement_group_id?: string | null;
      group_name?: string | null;
      item_code: string;
      category_prefix?: string;
      category_code?: string;
      item_name: string;
      category_name: string | null;
      unit_name: string | null;
      qty: number;
      price: number;
      has_tax: number;
    }>();

    const groupsQuery = new QueryBuilder()
      .select("requirement_group_id", "group_name", "has_detail", "budget")
      .from("requirement_groups")
      .where("project_id", "=", projectId)
      .orderBy("requirement_group_id", "ASC");

    const rawGroups = await groupsQuery.getMany<{
      requirement_group_id: string;
      group_name: string;
      has_detail: number;
      budget: number | null;
    }>();

    const groupBudgetMap = new Map<string, number | null>();
    for (const g of rawGroups) {
      if (g.has_detail) {
        groupBudgetMap.set(g.requirement_group_id, g.budget ?? null);
      }
    }

    const mapped: RequirementReportDetailItem[] = raw.map((row) => {
      const dpp = calcDPP(row.qty, row.price);
      const taxAmount = calcTax(dpp, Boolean(row.has_tax));
      const gBudget = row.requirement_group_id ? (groupBudgetMap.get(row.requirement_group_id) ?? null) : null;
      return {
        ...row,
        has_tax: Boolean(row.has_tax),
        dpp,
        tax_amount: taxAmount,
        total_price: dpp + taxAmount,
        group_budget: gBudget,
      };
    });

    const groupsWithItems = new Set<string>();
    for (const item of mapped) {
      if (item.requirement_group_id) {
        groupsWithItems.add(item.requirement_group_id);
      }
    }

    for (const group of rawGroups) {
      if (!groupsWithItems.has(group.requirement_group_id)) {
        const hasPagu = Boolean(group.has_detail);
        const hasBudget = hasPagu && group.budget != null && group.budget > 0;
        mapped.push({
          requirement_group_id: group.requirement_group_id,
          group_name: group.group_name,
          group_budget: hasPagu ? (group.budget ?? null) : null,
          item_code: hasBudget ? "PAGU" : "-",
          category_prefix: undefined,
          category_code: undefined,
          item_name: hasBudget ? group.group_name : "(Belum ada rincian item)",
          category_name: "-",
          unit_name: "-",
          qty: 0,
          price: hasBudget ? (group.budget ?? 0) : 0,
          has_tax: false,
          dpp: hasBudget ? (group.budget ?? 0) : 0,
          tax_amount: 0,
          total_price: hasBudget ? (group.budget ?? 0) : 0,
          is_empty_group: !hasBudget,
          is_pagu_account: hasBudget,
        });
      }
    }

    mapped.sort((a, b) => {
      const groupA = a.requirement_group_id || "";
      const groupB = b.requirement_group_id || "";
      const groupCmp = groupA.localeCompare(groupB);
      if (groupCmp !== 0) return groupCmp;
      return (a.item_name || "").localeCompare(b.item_name || "");
    });

    return mapped;
  } catch (error) {
    throw wrapDbError(error, "requirement_report");
  }
}
