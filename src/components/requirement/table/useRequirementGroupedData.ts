import { useMemo } from "react";
import type { RequirementGroup, RequirementDetail } from "@/db/repositories";
import { calcItemsSummary } from "@/utils/calc";
import type { RequirementRow } from "./useRequirementColumns";

interface UseRequirementGroupedDataResult {
  displayRequirements: RequirementRow[];
  groupOrder: string[];
}

/**
 * Custom hook untuk mentransformasikan data kebutuhan material dan kelompok pekerjaan
 * menjadi deretan baris tampilan tabel BOQ:
 * - Mengurutkan kelompok berbasis UUIDv7 ASC (pekerjaan terbaru berada di bawah).
 * - Menghasilkan baris pagu rekening untuk kelompok dengan budget.
 * - Menghasilkan baris full-width kosong untuk kelompok yang belum memiliki rincian.
 * - Menghasilkan rincian item material beserta baris footer subtotal kelompok.
 */
export function useRequirementGroupedData(
  requirements: RequirementDetail[],
  groups: RequirementGroup[],
): UseRequirementGroupedDataResult {
  const displayRequirements = useMemo<RequirementRow[]>(() => {
    const result: RequirementRow[] = [];
    const sortedGroups = groups.toSorted((a, b) => a.requirement_group_id.localeCompare(b.requirement_group_id));
    const processedReqIds = new Set<string>();

    for (const group of sortedGroups) {
      if (group.budget && group.budget > 0) {
        result.push({
          requirement_id: `pagu_${group.requirement_group_id}`,
          requirement_group_id: group.requirement_group_id,
          project_id: group.project_id,
          group_name: group.group_name,
          item_id: `pagu_${group.requirement_group_id}`,
          item_price_id: "",
          item_code: "-",
          item_name: "Pagu Anggaran (Rekening)",
          unit: "LS",
          price: group.budget,
          qty: 1,
          has_tax: false,
          created_at: group.created_at,
          updated_at: group.updated_at,
          deleted_at: null,
          is_pagu_account: true,
        });
        continue;
      }

      const groupReqs = requirements.filter(
        (r) =>
          r.requirement_group_id === group.requirement_group_id ||
          (!r.requirement_group_id && r.group_name === group.group_name),
      );

      if (groupReqs.length === 0) {
        result.push({
          requirement_id: `empty_${group.requirement_group_id}`,
          requirement_group_id: group.requirement_group_id,
          project_id: group.project_id,
          group_name: group.group_name,
          item_id: `empty_${group.requirement_group_id}`,
          item_price_id: "",
          item_code: "",
          item_name: "(Belum ada rincian item material)",
          unit: "-",
          price: 0,
          qty: 0,
          has_tax: false,
          created_at: group.created_at,
          updated_at: group.updated_at,
          deleted_at: null,
          is_empty_group: true,
        });
      } else {
        const { totalVolume, totalDpp, totalTax, grandTotal } = calcItemsSummary(groupReqs);

        for (const req of groupReqs) {
          result.push({ ...req });
          processedReqIds.add(req.requirement_id);
        }

        // Subtotal footer row per kelompok pekerjaan
        result.push({
          requirement_id: `subtotal_${group.requirement_group_id}`,
          requirement_group_id: group.requirement_group_id,
          project_id: group.project_id,
          group_name: group.group_name,
          item_id: `subtotal_${group.requirement_group_id}`,
          item_price_id: "",
          item_code: "",
          item_name: `Subtotal ${group.group_name}`,
          unit: "-",
          price: 0,
          qty: totalVolume,
          has_tax: false,
          created_at: group.created_at,
          updated_at: group.updated_at,
          deleted_at: null,
          is_group_subtotal: true,
          subtotal_volume: totalVolume,
          subtotal_dpp: totalDpp,
          subtotal_tax: totalTax,
          subtotal_total: grandTotal,
        });
      }
    }

    // Item kebutuhan yang belum terelasi ke kelompok terdaftar (jika ada)
    const remainingReqs = requirements.filter((r) => !processedReqIds.has(r.requirement_id));
    for (const req of remainingReqs) {
      result.push({ ...req });
    }

    return result;
  }, [requirements, groups]);

  const groupOrder = useMemo(() => {
    const sortedGroups = groups.toSorted((a, b) => a.requirement_group_id.localeCompare(b.requirement_group_id));
    const list: string[] = [];
    for (const g of sortedGroups) {
      if (g.group_name && !list.includes(g.group_name)) {
        list.push(g.group_name);
      }
    }
    for (const req of requirements) {
      if (req.group_name && !list.includes(req.group_name)) {
        list.push(req.group_name);
      }
    }
    return list;
  }, [requirements, groups]);

  return { displayRequirements, groupOrder };
}
