import { useMemo } from "react";
import { Button, HStack, Text } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { type TablePlugin, TableCell } from "@astryxdesign/core/Table";
import { formatNumber } from "@/utils/formatters";
import type { RequirementRow } from "./useRequirementColumns";
import type { RequirementDetail } from "@/db/repositories";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";

interface UseRequirementTableStateProps {
  requirements: RequirementDetail[];
  isApproved: boolean;
  onAdd: () => void;
}

export function useRequirementTableState({ requirements, isApproved, onAdd }: UseRequirementTableStateProps) {
  const grandTotal = useMemo(() => {
    let grand = 0;

    for (const b of requirements) {
      if (b.estimated_total != null) {
        grand += b.estimated_total;
      } else {
        const sub = (b.qty ?? 0) * (b.price ?? 0);
        grand += b.has_tax === 1 ? sub * 1.12 : sub;
      }
    }

    return grand;
  }, [requirements]);

  const dataWithFooters = useMemo(() => {
    const list = [...requirements] as RequirementRow[];

    list.push({
      requirement_id: "footer",
      isFooter: true,
    } as RequirementRow);

    return list;
  }, [requirements]);

  const footerPlugin = useMemo(
    (): TablePlugin<RequirementRow> => ({
      transformBodyRow(props, item) {
        if (item.isFooter) {
          return {
            ...props,
            children: (
              <TableCell colSpan={999} style={{ padding: "var(--spacing-3)" }}>
                <HStack justify="between" align="center" width="100%">
                  <div>
                    {!isApproved && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Plus size={16} />}
                        label="Tambah Kebutuhan"
                        onClick={onAdd}
                      />
                    )}
                  </div>
                  <HStack gap={2} align="end">
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
    [isApproved, grandTotal, onAdd],
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
