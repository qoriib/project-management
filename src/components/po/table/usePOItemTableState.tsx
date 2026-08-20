import { useMemo } from "react";
import { Button } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { type TablePlugin } from "@astryxdesign/core/Table";
import type { POItemRow } from "./usePOItemFormColumns";

import type { POItemDetail } from "@/db/repositories";

interface UsePOItemTableStateProps {
  items: POItemRow[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  setEditingData: (data: POItemDetail | undefined) => void;
}

export function usePOItemTableState({
  items,
  editingId,
  setEditingId,
  setEditingData,
}: UsePOItemTableStateProps) {
  const dataWithFooters = useMemo(() => {
    const list = [...items] as POItemRow[];

    if (editingId === "new-item") {
      list.push({
        isDraft: true,
        po_item_id: "new-item",
      } as unknown as POItemRow);
    }

    list.push({ isFooter: true, po_item_id: "footer" } as unknown as POItemRow);
    return list;
  }, [items, editingId]);

  const footerPlugin = useMemo(
    (): TablePlugin<POItemRow> => ({
      transformBodyRow(props, item) {
        if (item.isFooter) {
          const hideButton = Boolean(editingId);

          return {
            ...props,
            children: (
              <td colSpan={999}>
                {!hideButton && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus size={16} />}
                    label="Tambah Kebutuhan"
                    onClick={() => {
                      setEditingData(undefined);
                      setEditingId("new-item");
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
    [editingId, setEditingId, setEditingData],
  );

  return {
    dataWithFooters,
    footerPlugin,
  };
}
