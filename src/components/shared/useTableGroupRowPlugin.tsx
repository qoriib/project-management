import { useMemo } from "react";
import type { TablePlugin } from "@astryxdesign/core/Table";

export interface GroupRowPluginItem extends Record<string, unknown> {
  is_empty_group?: boolean;
  is_group_subtotal?: boolean;
}

/**
 * Hook plugin tabel Astryx untuk kelompok pekerjaan:
 * 1. Merender satu baris penuh (colSpan=999) untuk kelompok kosong.
 * 2. Menerapkan gaya latar belakang muted dan batas atas untuk baris subtotal kelompok,
 *    termasuk sinkronisasi kolom-kolom sticky.
 */
export function useTableGroupRowPlugin<T extends GroupRowPluginItem>(
  emptyGroupLabel = "(Belum ada rincian item material)",
): TablePlugin<T> {
  return useMemo<TablePlugin<T>>(
    () => ({
      transformBodyRow: (props, item) => {
        if (item && Boolean(item.is_empty_group)) {
          return {
            ...props,
            children: (
              <td
                colSpan={999}
                style={{
                  textAlign: "center",
                  padding: "var(--spacing-3)",
                  color: "var(--color-text-secondary)",
                  fontStyle: "italic",
                  fontSize: "var(--font-size-sm)",
                  backgroundColor: "var(--color-background-muted)",
                }}
              >
                {emptyGroupLabel}
              </td>
            ),
          };
        }
        if (item && Boolean(item.is_group_subtotal)) {
          return {
            ...props,
            htmlProps: {
              ...props.htmlProps,
              style: {
                ...props.htmlProps?.style,
                backgroundColor: "var(--color-background-muted)",
                "--table-sticky-background": "var(--color-background-muted)",
                borderTop: "1px solid var(--color-border)",
              },
            },
          };
        }
        return props;
      },
      transformBodyCell: (props, _column, item) => {
        if (item && Boolean(item.is_group_subtotal)) {
          return {
            ...props,
            htmlProps: {
              ...props.htmlProps,
              style: {
                ...props.htmlProps?.style,
                backgroundColor: "var(--color-background-muted)",
                "--table-sticky-background": "var(--color-background-muted)",
                borderTop: "1px solid var(--color-border)",
              },
            },
          };
        }
        return props;
      },
    }),
    [emptyGroupLabel],
  );
}
