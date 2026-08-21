import { HStack, IconButton, Selector, VStack } from "@astryxdesign/core";
import { Plus } from "lucide-react";
import { getFieldError } from "@/utils/form";
import type { ItemWithDetails } from "@/db/repositories";
import type { BaseCellProps } from "./types";

export interface ItemSelectorCellProps extends BaseCellProps {
  items: ItemWithDetails[];
  handleItemChange: (v: string) => void;
  onAddNewItem: () => void;
}

export function ItemSelectorCell({ form, items, handleItemChange, onAddNewItem }: ItemSelectorCellProps) {
  return (
    <HStack gap={1} align="start" width="100%">
      <VStack width="100%">
        <form.Field name="item_id">
          {(field) => (
            <Selector
              hasSearch
              searchPlaceholder="Cari item..."
              isLabelHidden
              label="Item"
              statusVariant="tooltip"
              value={field.state.value}
              onChange={(v) => handleItemChange(v)}
              onBlur={field.handleBlur}
              options={items.map((it) => ({
                label: it.item_name,
                value: it.item_id,
              }))}
              status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
            />
          )}
        </form.Field>
      </VStack>
      <IconButton variant="secondary" label="Tambah Item Baru" icon={<Plus size={16} />} onClick={onAddNewItem} />
    </HStack>
  );
}
