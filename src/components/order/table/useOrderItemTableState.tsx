import { useMemo } from "react";
import { Button } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { type TablePlugin, TableCell } from "@astryxdesign/core/Table";
import type { OrderItemRow } from "./useOrderItemFormColumns";
import type { OrderItemDetail } from "@/db/repositories";

interface UseOrderItemTableStateProps {
  items: OrderItemRow[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  setEditingData: (data: OrderItemDetail | undefined) => void;
}

export function useOrderItemTableState({
  items,
  editingId,
  setEditingId,
  setEditingData,
}: UseOrderItemTableStateProps) {
  const dataWithFooters = useMemo(() => {
    const list = [...items] as OrderItemRow[];

    if (editingId === "new-item") {
      list.push({
        isDraft: true,
        order_item_id: "new-item",
      } as unknown as OrderItemRow);
    }

    list.push({ isFooter: true, order_item_id: "footer" } as unknown as OrderItemRow);
    return list;
  }, [items, editingId]);

  const footerPlugin = useMemo(
    (): TablePlugin<OrderItemRow> => ({
      transformBodyRow(props, item) {
        if (item.isFooter) {
          const hideButton = Boolean(editingId);

          return {
            ...props,
            children: (
              <TableCell colSpan={999} style={{ padding: "var(--spacing-3)" }}>
                {!hideButton && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus size={16} />}
                    label="Tambah Item"
                    onClick={() => {
                      setEditingData(undefined);
                      setEditingId("new-item");
                    }}
                  />
                )}
              </TableCell>
            ),
          };
        }

        return props;
      },
    }),
    [editingId, setEditingId, setEditingData],
  );

  return {
    dataWithFooters,
    footerPlugin,
  };
}
