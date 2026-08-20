import type { ItemSelectorCellProps } from "./ItemSelectorCell";

export function UnitDisplayCell({ form, items }: Omit<ItemSelectorCellProps, "handleItemChange" | "onAddNewItem">) {
  return (
    <form.Subscribe selector={(s) => s.values.item_id}>
      {(itemId) => {
        const selected = items.find((i) => i.item_id === itemId);
        return selected?.unit_name ?? "-";
      }}
    </form.Subscribe>
  );
}
