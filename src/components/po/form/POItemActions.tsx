import { HStack, VStack, Text, IconButton } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { formatNumber } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { X } from "lucide-react";
import type { POItemRow } from "./po.schema";
import type { CellFormProps } from "./POItemCells";

/** Displays planned volume and current realization volume for selected item */
export function BomInfoCell({ row }: { row: POItemRow }) {
  if (!row.item_id) return null;
  return (
    <VStack gap={0.5}>
      <Text weight="medium">
        Realisasi: {formatNumber(row.total_ordered, 2)} {row.unit}
      </Text>
      <Text size="sm" color="secondary">
        Rencana: {formatNumber(row.planned_volume, 2)} {row.unit}
      </Text>
    </VStack>
  );
}

interface QtyInputCellProps extends CellFormProps {
  initialBalance: number;
}

/** Input cell for order volume with max balance validation */
export function QtyInputCell({ form, idx, initialBalance }: QtyInputCellProps) {
  return (
    <form.Field
      name={`items[${idx}].qty`}
      validators={{
        onChange: ({ value }: { value: number }) =>
          value > initialBalance
            ? `Melebihi sisa BOM (${formatNumber(initialBalance, 2)}).`
            : undefined,
      }}
    >
      {(field) => (
        <NumberInput
          label="Volume"
          isLabelHidden
          value={field.state.value}
          onChange={(v) => field.handleChange(v || 0)}
          onBlur={field.handleBlur}
          statusVariant="tooltip"
          status={getFieldError(
            field.state.meta.errors,
            !!field.state.meta.isTouched
          )}
        />
      )}
    </form.Field>
  );
}

/** Button cell to delete item row from PO list */
export function RemoveItemCell({ form, idx }: CellFormProps) {
  return (
    <HStack justify="end">
      <form.Field name="items">
        {(field) => (
          <IconButton
            icon={<X size={16} />}
            size="sm"
            variant="secondary"
            type="button"
            label="Hapus Item"
            onClick={() => field.removeValue(idx)}
          />
        )}
      </form.Field>
    </HStack>
  );
}
