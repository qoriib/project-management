import { QueryBuilder } from "@/db/core/query-builder";
import { wrapDbError } from "@/db/core/errors";
import { calcDPP, calcTax } from "@/utils/calc";
import type { RequirementReportDetailItem } from "./types";

/**
 * Gets all BOQ (requirement) items for a project formatted for export.
 */
export async function getProjectRequirementReport(projectId: string): Promise<RequirementReportDetailItem[]> {
  try {
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
        "item_prices.price",
        "requirements.has_tax",
      )
      .from("requirements", "requirements")
      .leftJoin(
        "requirement_groups",
        "requirement_groups",
        "requirement_groups.requirement_group_id = requirements.requirement_group_id AND requirement_groups.deleted_at IS NULL",
      )
      .join("items", "items", "items.item_id = requirements.item_id AND items.deleted_at IS NULL")
      .join(
        "item_prices",
        "item_prices",
        "item_prices.item_price_id = requirements.item_price_id AND item_prices.deleted_at IS NULL",
      )
      .leftJoin(
        "item_categories",
        "categories",
        "categories.category_id = items.category_id AND categories.deleted_at IS NULL",
      )
      .leftJoin("units", "units", "units.unit_id = items.unit_id AND units.deleted_at IS NULL")
      .where("requirements.project_id", "=", projectId)
      .withSoftDelete("requirements")
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
      .select("requirement_group_id", "group_name", "budget")
      .from("requirement_groups")
      .where("project_id", "=", projectId)
      .withSoftDelete("requirement_groups")
      .orderBy("requirement_group_id", "ASC");

    const rawGroups = await groupsQuery.getMany<{ requirement_group_id: string; group_name: string; budget: number }>();

    const mapped: RequirementReportDetailItem[] = raw.map((row) => {
      const dpp = calcDPP(row.qty, row.price);
      const taxAmount = calcTax(dpp, Boolean(row.has_tax));
      return {
        ...row,
        has_tax: Boolean(row.has_tax),
        dpp,
        tax_amount: taxAmount,
        total_price: dpp + taxAmount,
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
        mapped.push({
          requirement_group_id: group.requirement_group_id,
          group_name: group.group_name,
          item_code: "-",
          category_prefix: undefined,
          category_code: undefined,
          item_name: "(Belum ada rincian item)",
          category_name: "-",
          unit_name: "-",
          qty: 0,
          price: 0,
          has_tax: false,
          dpp: 0,
          tax_amount: 0,
          total_price: 0,
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
