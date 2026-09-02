import { useMemo } from "react";
import {
  useTableRowIndex as useBaseTableRowIndex,
  type UseTableRowIndexConfig,
  type TablePlugin,
} from "@astryxdesign/core/Table";

export function useTableRowIndex<T extends Record<string, unknown>>(config: UseTableRowIndexConfig<T>): TablePlugin<T> {
  const basePlugin = useBaseTableRowIndex({
    label: "",
    ...config,
  });

  return useMemo(() => {
    return {
      ...basePlugin,
      transformColumns(columns) {
        if (!basePlugin.transformColumns) return columns;
        const result = basePlugin.transformColumns(columns);
        // The first column returned by basePlugin is the index column
        // We override its width to 64px
        if (result.length > 0 && result[0].key === "__rowIndex") {
          result[0] = { ...result[0], width: { type: "pixel", value: 52 }, align: "start" };
        }
        return result;
      },
    };
  }, [basePlugin]);
}
