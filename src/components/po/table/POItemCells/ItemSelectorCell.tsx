import { Selector } from "@astryxdesign/core";
import { getFieldError } from "@/utils/form";
import type { BOMReportItem } from "@/db/services/report.service";
import type { CellFormProps } from "./types";

interface ItemSelectorCellProps extends CellFormProps {
  bomOptions: BOMReportItem[];
  selectedItemIds: Set<string>;
  onChangeItem: (itemId: string) => Promise<void>;
  editingId: string | null;
}

export function ItemSelectorCell({
  form,
  bomOptions,
  selectedItemIds,
  onChangeItem,
  editingId,
}: ItemSelectorCellProps) {
  return (
    <form.Field name="item_id">
      {(field) => {
        const currentVal = field.state.value,
          options = bomOptions
            .filter(
              (b) =>
                b.item_id === currentVal ||
                !selectedItemIds.has(b.item_id) ||
                editingId !== "new-item",
            )
            .map((b) => ({
              label: `${b.item_name} (${b.unit ?? ""})`,
              value: b.item_id,
            }));

        return (
          <Selector
            label="Item"
            isLabelHidden
            hasSearch
            placeholder="Pilih Item..."
            statusVariant="tooltip"
            value={field.state.value}
            options={options}
            onChange={(v) => onChangeItem(v)}
            onBlur={field.handleBlur}
            status={getFieldError(
              field.state.meta.errors,
              field.state.meta.isTouched,
            )}
          />
        );
      }}
    </form.Field>
  );
}
