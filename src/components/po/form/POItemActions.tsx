/**
 * POItemActions — Action/display cells untuk form PO:
 * BomInfoCell, QtyInputCell, RemoveItemCell
 */
import { HStack, VStack, Text, IconButton } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { formatNumber } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { X } from "lucide-react";
import type { POItemRow } from "./po.schema";
import type { CellFormProps } from "./POItemCells";

// ── BomInfoCell ───────────────────────────────────────────────────────────────

/** Menampilkan sisa BOM dan volume rencana untuk item yang dipilih */
export function BomInfoCell({ row }: { row: POItemRow }) {
  if (!row.item_id) return null;
  const sisaAkhir = row.sisaAwal - row.qty;
  return (
    <VStack gap={0.5}>
      <Text size="sm" weight="medium">
        {formatNumber(sisaAkhir, 2)} {row.unit} (Sisa)
      </Text>
      <Text size="sm" color="secondary">
        Rencana: {row.planned_volume} {row.unit}
      </Text>
    </VStack>
  );
}

// ── QtyInputCell ──────────────────────────────────────────────────────────────

interface QtyInputCellProps extends CellFormProps {
  sisaAwal: number;
}

/** Input volume dipesan dengan validasi tidak boleh melebihi sisa BOM */
export function QtyInputCell({ form, idx, sisaAwal }: QtyInputCellProps) {
  return (
    <form.Field
      name={`items[${idx}].qty`}
      validators={{
        onChange: ({ value }: { value: number }) =>
          value > sisaAwal
            ? `Melebihi sisa BOM (${formatNumber(sisaAwal, 2)}).`
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
          statusVariant="attached"
          status={getFieldError(
            field.state.meta.errors,
            !!field.state.meta.isTouched
          )}
        />
      )}
    </form.Field>
  );
}

// ── RemoveItemCell ────────────────────────────────────────────────────────────

/** Tombol hapus baris item dari daftar PO */
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
