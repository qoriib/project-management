import { useMemo } from "react";
import { Button } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { type TablePlugin, TableCell, useTableRowIndex } from "@astryxdesign/core/Table";
import type { RequirementRow } from "./useRequirementColumns";
import type { RequirementDetail } from "@/db/repositories";

interface UseRequirementTableStateProps {
  requirements: RequirementDetail[];
  editingId: string | null;
  isApproved: boolean;
  setEditingId: (id: string | null) => void;
}

export function useRequirementTableState({
  requirements,
  editingId,
  isApproved,
  setEditingId,
}: UseRequirementTableStateProps) {
  const grandTotal = useMemo(() => {
    let grand = 0;

    for (const b of requirements) {
      grand += b.estimated_total ?? 0;
    }

    return grand;
  }, [requirements]);

  const dataWithFooters = useMemo(() => {
    const list = [...requirements] as RequirementRow[];

    if (editingId === "new") {
      list.push({
        requirement_id: "new",
        isDraft: true,
      } as RequirementRow);
    }

    list.push({
      requirement_id: "footer",
      isFooter: true,
    } as RequirementRow);

    return list;
  }, [requirements, editingId, isApproved]);

  const footerPlugin = useMemo(
    (): TablePlugin<RequirementRow> => ({
      transformBodyRow(props, item) {
        if (item.isFooter) {
          const hideButton = Boolean(editingId);

          return {
            ...props,
            children: (
              <TableCell colSpan={999} style={{ padding: "var(--spacing-3)" }}>
                {!hideButton && !isApproved && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus size={16} />}
                    label="Tambah Kebutuhan"
                    onClick={() => setEditingId("new")}
                  />
                )}
              </TableCell>
            ),
          };
        }
        return props;
      },
    }),
    [editingId, isApproved, setEditingId],
  );

  const rowIndexPlugin = useTableRowIndex<RequirementRow>({
    data: dataWithFooters,
    getRowKey: (item) => String(item.requirement_id),
    label: "#",
  });

  return {
    footerPlugin,
    grandTotal,
    dataWithFooters,
    rowIndexPlugin,
  };
}
