import { useMasterStore } from "@/store/useMasterStore";
import type { CellFormProps } from "./types";

export function UnitDisplayCell({ form }: CellFormProps) {
  const { items: masterItems } = useMasterStore();

  return (
    <form.Subscribe selector={(state) => state.values.item_id}>
      {(itemId) => {
        const item = masterItems.find((masterItem) => masterItem.item_id === itemId);
        return item?.unit_name ?? "-";
      }}
    </form.Subscribe>
  );
}
