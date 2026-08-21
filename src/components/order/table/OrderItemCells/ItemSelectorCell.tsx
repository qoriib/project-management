import { Selector } from "@astryxdesign/core";
import { getFieldError } from "@/utils/form";
import { useMasterStore } from "@/store/useMasterStore";
import { useRequirementStore } from "@/store/useRequirementStore";
import type { CellFormProps } from "./types";

interface ItemSelectorCellProps extends CellFormProps {
  onChangeItem: (itemId: string) => Promise<void>;
}

export function ItemSelectorCell({ form, onChangeItem }: ItemSelectorCellProps) {
  const { items } = useMasterStore();
  const { requirements } = useRequirementStore();

  // Set of item_ids that exist in the project's requirements
  const requirementItemIds = new Set(requirements.map((r) => r.item_id).filter(Boolean) as string[]);

  return (
    <form.Field name="item_id">
      {(field) => {
        const options = items.map((item) => {
          const inRequirement = requirementItemIds.has(item.item_id);
          const suffix = inRequirement ? "" : "Tidak di Rencana";

          return {
            label: `${item.item_name} (${item.unit_name ?? ""})${suffix}`,
            value: item.item_id,
          };
        });

        return (
          <Selector
            label="Item"
            isLabelHidden
            hasSearch
            searchPlaceholder="Cari item..."
            statusVariant="tooltip"
            value={field.state.value}
            options={options}
            onChange={(v) => onChangeItem(v as string)}
            onBlur={field.handleBlur}
            status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
          />
        );
      }}
    </form.Field>
  );
}
