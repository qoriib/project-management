import { type CSSProperties, useMemo } from "react";
import type { TablePlugin } from "@astryxdesign/core/Table";
import type { RequirementGroup } from "@/db/repositories";
import type { RequirementRow } from "./useRequirementColumns";

/**
 * Gaya visual untuk baris pagu rekening agar selaras dengan warna latar group header.
 */
export const PAGU_ROW_STYLE: CSSProperties = {
  backgroundColor: "var(--color-background-muted)",
  "--table-row-overlay": "var(--color-background-muted)",
  borderBottom: "1px solid var(--color-border)",
} as CSSProperties;

/**
 * Membangun peta cepat (Map) item pagu rekening berdasarkan ID kelompok pekerjaan.
 */
export function buildPaguItemMap(items: readonly RequirementRow[]): Map<string, RequirementRow> {
  const paguMap = new Map<string, RequirementRow>();

  for (const item of items) {
    if (item.is_pagu_account && item.requirement_group_id) {
      paguMap.set(item.requirement_group_id, item);
    }
  }

  return paguMap;
}

interface MergeMixedTableDataParams {
  hasNonPaguGroups: boolean;
  displayRequirements: RequirementRow[];
  sortedGroups: RequirementGroup[];
  paguItemMap: ReadonlyMap<string, RequirementRow>;
  groupedData: RequirementRow[];
}

/**
 * Menggabungkan data tabel rencana kebutuhan untuk proyek bertipe campuran (BOQ & Pagu):
 * - Menjaga urutan kelompok pekerjaan sesuai sortedGroups.
 * - Memasukkan baris pagu rekening di posisi kelompoknya.
 * - Memasukkan baris data rincian item material yang dihasilkan plugin grouping.
 * - Memasukkan item ungrouped jika ada.
 */
export function mergeMixedTableData({
  hasNonPaguGroups,
  displayRequirements,
  sortedGroups,
  paguItemMap,
  groupedData,
}: MergeMixedTableDataParams): RequirementRow[] {
  // Jika seluruh proyek bertipe pagu (tidak ada kelompok BOQ bertingkat)
  if (!hasNonPaguGroups) {
    return displayRequirements;
  }

  const mergedRows: RequirementRow[] = [];
  const includedPaguIds = new Set<string>();

  for (const group of sortedGroups) {
    const isPaguGroup = group.budget != null && group.budget > 0;

    if (isPaguGroup) {
      const paguRow = paguItemMap.get(group.requirement_group_id);
      if (paguRow && !includedPaguIds.has(paguRow.requirement_id)) {
        mergedRows.push(paguRow);
        includedPaguIds.add(paguRow.requirement_id);
      }
    } else {
      for (const row of groupedData) {
        const groupKey = (row as unknown as { groupKey?: string }).groupKey;
        const isMatchingGroup = groupKey === group.group_name || row.group_name === group.group_name;
        if (isMatchingGroup) {
          mergedRows.push(row);
        }
      }
    }
  }

  // Tambahkan baris ungrouped jika ada item tanpa kelompok
  for (const row of groupedData) {
    const groupKey = (row as unknown as { groupKey?: string }).groupKey;
    const isUngrouped = !groupKey && !row.group_name;
    if (isUngrouped && !mergedRows.includes(row)) {
      mergedRows.push(row);
    }
  }

  return mergedRows;
}

/**
 * Hook untuk membuat plugin tabel yang memberi latar belakang khusus pada baris pagu rekening.
 */
export function usePaguRowPlugin(): TablePlugin<RequirementRow> {
  return useMemo<TablePlugin<RequirementRow>>(() => {
    function applyPaguHighlight<TProps extends { htmlProps?: { style?: CSSProperties } }>(
      targetProps: TProps,
      item?: RequirementRow,
    ): TProps {
      const isPaguAccount = Boolean(item?.is_pagu_account);

      if (!isPaguAccount) {
        return targetProps;
      }

      return {
        ...targetProps,
        htmlProps: {
          ...targetProps.htmlProps,
          style: {
            ...targetProps.htmlProps?.style,
            ...PAGU_ROW_STYLE,
          },
        },
      };
    }

    return {
      transformBodyRow: (rowProps, item) => applyPaguHighlight(rowProps, item),
      transformBodyCell: (cellProps, _column, item) => applyPaguHighlight(cellProps, item),
    };
  }, []);
}
