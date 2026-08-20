import { useMemo, useState } from "react";
import { Button, HStack, Text } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";
import { Plus } from "lucide-react";
import { type TablePlugin, useTableGroupedRows } from "@astryxdesign/core/Table";
import type { BomRow } from "./useBOMColumns";
import type { BOMDetail, BOMGroup } from "@/db/repositories";

interface UseBOMTableStateProps {
  boms: BOMDetail[];
  bomGroups: BOMGroup[];
  editingId: string | null;
  isApproved: boolean;
  setEditingId: (id: string | null) => void;
}

export function useBOMTableState({
  boms,
  bomGroups,
  editingId,
  isApproved,
  setEditingId,
}: UseBOMTableStateProps) {
  const { grandTotal, categorySubtotals } = useMemo(() => {
    let grand = 0;
    const subtotals: Record<string, number> = {};

    for (const b of boms) {
      const cat = b.bom_group_id;
      const total = b.estimated_total ?? 0;

      grand += total;

      subtotals[cat] = (subtotals[cat] ?? 0) + total;
    }

    return { categorySubtotals: subtotals, grandTotal: grand };
  }, [boms]);

  // Create a map to get group names from group ids
  const groupNameMap = useMemo(() => {
    const map: Record<string, string> = {};

    for (const bg of bomGroups) {
      map[bg.bom_group_id] = bg.group_name;
    }

    for (const b of boms) {
      if (b.bom_group_id && !map[b.bom_group_id]) {
        map[b.bom_group_id] = b.bom_group_name || "Grup Tidak Diketahui";
      }
    }

    return map;
  }, [boms, bomGroups]);

  const dataWithFooters = useMemo(() => {
    const list = [...boms] as BomRow[];
    const groupIds = new Set(boms.map((b) => b.bom_group_id));

    // Add all empty groups from bomGroups
    for (const bg of bomGroups) {
      groupIds.add(bg.bom_group_id);
    }

    for (const gid of groupIds) {
      if (!gid) {
        continue;
      }

      if (editingId === `new-${gid}`) {
        list.push({
          bom_group_id: gid,
          bom_id: `new-${gid}`,
          isDraft: true,
        } as BomRow);
      }

      list.push({
        bom_group_id: gid,
        bom_id: `footer-${gid}`,
        isFooter: true,
      } as BomRow);
    }

    return list;
  }, [boms, editingId, isApproved]);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const {
    data: groupedData,
    plugin: groupedPlugin,
    idKey: groupedIdKey,
  } = useTableGroupedRows<BomRow>({
    collapsedGroups,
    data: dataWithFooters,
    getRowKey: (item) => String(item.bom_id),
    groupBy: (item) => item.bom_group_id,
    onToggleGroup: (key) => {
      if (!editingId) {
        setCollapsedGroups((prev) => {
          const next = new Set(prev);

          if (next.has(key)) {
            next.delete(key);
          } else {
            next.add(key);
          }

          return next;
        });
      }
    },
    renderGroupHeader: (key) => {
      const groupName = groupNameMap[key];
      return (
        <HStack justify="between" align="center" paddingInline={1} width="100%">
          <Text weight="bold">{groupName}</Text>
          <HStack paddingInline={2}>
            <Text type="code" weight="bold">
              {formatNumber(categorySubtotals[key] ?? 0)}
            </Text>
          </HStack>
        </HStack>
      );
    },
  });

  const footerPlugin = useMemo(
    (): TablePlugin<BomRow> => ({
      transformBodyRow(props, item) {
        if (item.isFooter) {
          const groupId = item.bom_group_id;
          const hideButton = Boolean(editingId);

          return {
            ...props,
            children: (
              <td colSpan={999}>
                {!hideButton && !isApproved && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus size={16} />}
                    label="Tambah Kebutuhan"
                    onClick={() => {
                      setEditingId(`new-${groupId}`);
                      setCollapsedGroups((prev) => {
                        const next = new Set(prev);
                        next.delete(groupId);
                        return next;
                      });
                    }}
                  />
                )}
              </td>
            ),
          };
        }

        return props;
      },
    }),
    [editingId, isApproved, setEditingId],
  );

  return {
    footerPlugin,
    grandTotal,
    groupedData,
    groupedIdKey,
    groupedPlugin,
  };
}
