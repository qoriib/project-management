import { type CSSProperties, useMemo } from "react";
import type { TablePlugin } from "@astryxdesign/core/Table";
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
 * Mengecek apakah suatu item adalah item unplanned (tidak ada di BOQ / di luar rencana BOQ).
 * Tetap menandai peringatan termasuk jika item berada di kelompok pagu.
 */
export function isUnplannedItem(item: EnrichedReportItem | null | undefined): boolean {
  return Boolean(item?.is_unplanned && !item.is_group_footer && !item.is_empty_group);
}

/**
 * Hook untuk membuat plugin tabel yang mewarnai baris dan sel item unplanned
 * dengan warna peringatan (warning / kuning).
 */
export function useUnplannedRowPlugin(): TablePlugin<EnrichedReportItem> {
  return useMemo<TablePlugin<EnrichedReportItem>>(() => {
    function applyWarningHighlight<TProps extends { htmlProps?: { style?: CSSProperties } }>(
      targetProps: TProps,
      item?: EnrichedReportItem,
    ): TProps {
      if (!isUnplannedItem(item)) {
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
