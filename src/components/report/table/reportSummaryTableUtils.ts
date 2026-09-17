import { type CSSProperties, useMemo } from "react";
import type { TablePlugin } from "@astryxdesign/core/Table";
import type { RequirementReportItem } from "@/db/services";
import type { EnrichedReportItem } from "./useReportSummaryColumns";

/**
 * Gaya visual untuk menandai baris atau sel item unplanned (di luar rencana BOQ).
 */
export const UNPLANNED_WARNING_ROW_STYLE: CSSProperties = {
  backgroundColor: "var(--color-warning-muted)",
  "--table-row-overlay": "var(--color-warning-muted)",
  borderBottom: "1px solid var(--color-border)",
} as CSSProperties;

/**
 * Mengumpulkan daftar nama kelompok pekerjaan yang memiliki pagu anggaran (budget > 0).
 */
export function extractPaguGroupNames(report: readonly RequirementReportItem[]): Set<string> {
  const paguGroupNames = new Set<string>();

  for (const item of report) {
    const hasValidBudget = item.group_budget != null && item.group_budget > 0;
    if (item.group_name && hasValidBudget) {
      paguGroupNames.add(item.group_name);
    }
  }

  return paguGroupNames;
}

/**
 * Mengecek apakah suatu item adalah item unplanned (tidak ada di BOQ / di luar rencana BOQ).
 * Tetap menandai kuning termasuk jika item berada di kelompok pagu.
 */
export function isUnplannedItem(item: EnrichedReportItem | null | undefined): boolean {
  if (!item || !item.is_unplanned || item.is_group_footer || item.is_empty_group) {
    return false;
  }

  return true;
}

export const isUnplannedNonPaguItem = (
  item: EnrichedReportItem | null | undefined,
  _paguGroupNames?: ReadonlySet<string>,
): boolean => isUnplannedItem(item);

/**
 * Hook untuk membuat plugin tabel yang mewarnai baris dan sel item unplanned
 * dengan warna peringatan (warning / kuning), termasuk jika berada di kelompok pagu.
 */
export function useUnplannedRowPlugin(_paguGroupNames?: ReadonlySet<string>): TablePlugin<EnrichedReportItem> {
  return useMemo<TablePlugin<EnrichedReportItem>>(() => {
    function applyWarningHighlight<TProps extends { htmlProps?: { style?: CSSProperties } }>(
      targetProps: TProps,
      item?: EnrichedReportItem,
    ): TProps {
      const shouldHighlight = isUnplannedItem(item);

      if (!shouldHighlight) {
        return targetProps;
      }

      return {
        ...targetProps,
        htmlProps: {
          ...targetProps.htmlProps,
          style: {
            ...targetProps.htmlProps?.style,
            ...UNPLANNED_WARNING_ROW_STYLE,
          },
        },
      };
    }

    return {
      transformBodyRow: (rowProps, item) => applyWarningHighlight(rowProps, item),
      transformBodyCell: (cellProps, _column, item) => applyWarningHighlight(cellProps, item),
    };
  }, []);
}
