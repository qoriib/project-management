import { useMemo } from "react";
import { Button, HStack, Text } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { type TablePlugin, TableCell } from "@astryxdesign/core/Table";
import type { OrderItemRow } from "./useOrderItemFormColumns";

interface UseOrderItemTableStateProps {
  items: OrderItemRow[];
  onAdd: () => void;
}

export function useOrderItemTableState({ items, onAdd }: UseOrderItemTableStateProps) {
  const grandTotal = useMemo(() => {
    let grand = 0;
    for (const item of items) {
      const sub = (item.qty ?? 0) * (item.price ?? 0);
      grand += item.has_tax ? sub * 1.12 : sub;
    }
    return grand;
  }, [items]);

  const dataWithFooters = useMemo(() => {
    const list = [...items] as OrderItemRow[];
    list.push({ isFooter: true, order_item_id: "footer" } as unknown as OrderItemRow);
    return list;
  }, [items]);

  const footerPlugin = useMemo(
    (): TablePlugin<OrderItemRow> => ({
      transformBodyRow(props, item) {
        if (item.isFooter) {
          return {
            ...props,
            children: (
              <TableCell colSpan={999}>
                <HStack justify="between" align="center" width="100%">
                  <div>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Plus size={16} />}
                      label="Tambah Item"
                      onClick={onAdd}
                    />
                  </div>
                  <HStack gap={2} align="center">
                    <Text weight="medium" size="base" color="secondary">
                      Total:
                    </Text>
                    <Text type="code" weight="bold" size="lg" color="primary">
                      Rp {formatNumber(grandTotal)}
                    </Text>
                  </HStack>
                </HStack>
              </TableCell>
            ),
          };
        }

        return props;
      },
    }),
    [onAdd, grandTotal],
  );

  return {
    dataWithFooters,
    footerPlugin,
    grandTotal,
  };
}
