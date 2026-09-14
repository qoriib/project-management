import { useMemo } from "react";
import {
  useTableRowIndex as useBaseTableRowIndex,
  type UseTableRowIndexConfig,
  type TablePlugin,
} from "@astryxdesign/core/Table";

export function useTableRowIndex<T extends Record<string, unknown>>(config: UseTableRowIndexConfig<T>): TablePlugin<T> {
  const basePlugin = useBaseTableRowIndex({
    label: "#",
    ...config,
  });

  const itemIndexMap = useMemo(() => {
    const map = new Map<unknown, number>();
    let counter = 1;
    for (const item of config.data) {
      if (
        item &&
        (Boolean((item as Record<string, unknown>).is_group_subtotal) ||
          Boolean((item as Record<string, unknown>).is_empty_group))
      ) {
        continue;
      }
      const key = config.getRowKey ? config.getRowKey(item) : item;
      map.set(key, counter++);
    }
    return map;
  }, [config.data, config.getRowKey]);

  return useMemo(() => {
    return {
      ...basePlugin,
      transformColumns(columns) {
        if (!basePlugin.transformColumns) return columns;
        const result = basePlugin.transformColumns(columns);
        if (result.length > 0 && result[0].key === "__rowIndex") {
          result[0] = {
            ...result[0],
            width: { type: "pixel", value: 54 },
            align: "end",
            renderCell: (item: T) => {
              if (
                item &&
                (Boolean((item as Record<string, unknown>).is_group_subtotal) ||
                  Boolean((item as Record<string, unknown>).is_empty_group))
              ) {
                return null;
              }
              const key = config.getRowKey ? config.getRowKey(item) : item;
              const num = itemIndexMap.get(key);
              return num != null ? (
                <span
                  style={{
                    fontFamily: "var(--font-family-code)",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {num}
                </span>
              ) : null;
            },
          };
        }
        return result;
      },
    };
  }, [basePlugin, config.getRowKey, itemIndexMap]);
}
