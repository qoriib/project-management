import { useMemo, type ReactNode } from "react";
import { useTableRowIndex as useAstryxTableRowIndex, pixel, type TablePlugin } from "@astryxdesign/core/Table";

export interface UseTableRowIndexConfig<T extends Record<string, unknown>> {
  /** The data array currently rendered by the table (post sort/filter/page). */
  data: T[];
  /**
   * Optional key extractor returning a unique string per row.
   */
  getRowKey?: (item: T) => string;
  /** Header label for the index column. @default '#' */
  label?: ReactNode;
  /** First index value. @default 1 */
  startFrom?: number;
  /** Width of the row index column in pixels. @default 64 */
  width?: number;
}

export const DEFAULT_ROW_INDEX_WIDTH = 64;

/**
 * Custom wrapper around Astryx's useTableRowIndex to provide a wider default
 * column width (64px instead of 48px) for better spacing and readability across all tables.
 */
export function useTableRowIndex<T extends Record<string, unknown>>(config: UseTableRowIndexConfig<T>): TablePlugin<T> {
  const { width = DEFAULT_ROW_INDEX_WIDTH, ...rest } = config;
  const basePlugin = useAstryxTableRowIndex(rest);

  return useMemo(
    (): TablePlugin<T> => ({
      ...basePlugin,
      transformColumns(columns) {
        const transformed = basePlugin.transformColumns ? [...basePlugin.transformColumns(columns)] : [...columns];
        if (transformed.length > 0 && transformed[0].key === "__rowIndex") {
          transformed[0] = {
            ...transformed[0],
            width: pixel(width),
          };
        }
        return transformed;
      },
    }),
    [basePlugin, width],
  );
}
