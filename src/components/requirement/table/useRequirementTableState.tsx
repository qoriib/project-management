import { useMemo } from "react";
import { Button, HStack, Text } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { formatNumber } from "@/utils/formatters";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { calcGrandTotal } from "@/utils/calc";
import { type TablePlugin, TableCell } from "@astryxdesign/core/Table";
import type { RequirementRow } from "./useRequirementColumns";
import type { RequirementDetail } from "@/db/repositories";

interface UseRequirementTableStateProps {
  requirements: RequirementDetail[];
  isApproved: boolean;
  onAdd: () => void;
}

export function useRequirementTableState({ requirements, isApproved, onAdd }: UseRequirementTableStateProps) {
  const grandTotal = useMemo(() => calcGrandTotal(requirements), [requirements]);

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
              <TableCell colSpan={999}>
                <HStack justify="between" align="center" width="100%">
                  <HStack align="center">
                    {!isApproved && (
                      <Button variant="secondary" size="sm" icon={<Plus />} label="Tambah Kebutuhan" onClick={onAdd} />
                    )}
                  </HStack>
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
    [isApproved, grandTotal, onAdd],
  );

  const rowIndexPlugin = useTableRowIndex<RequirementRow>({
    data: dataWithFooters,
    getRowKey: (item) => String(item.requirement_id),
  });

  return {
    footerPlugin,
    grandTotal,
    dataWithFooters,
    rowIndexPlugin,
  };
}
