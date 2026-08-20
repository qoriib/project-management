import { EntityCode } from "@/components/shared/EntityCode";
import { formatItemCode } from "@/utils/formatters";
import type { ItemSelectorCellProps } from "./ItemSelectorCell";

export function ItemCodeDisplayCell({ form, items }: Omit<ItemSelectorCellProps, "handleItemChange" | "onAddNewItem">) {
  return (
    <form.Subscribe selector={(s) => s.values.item_id}>
      {(itemId) => {
        const selected = items.find((i) => i.item_id === itemId);

        if (!selected) {
          return "-";
        }

        const code = formatItemCode(selected);

        return <EntityCode id={code} />;
      }}
    </form.Subscribe>
  );
}
