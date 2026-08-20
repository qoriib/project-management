import { useMasterStore } from "@/store/useMasterStore";
import type { CellFormProps } from "./types";

export function UnitDisplayCell({ form }: CellFormProps) {
  const { items: masterItems } = useMasterStore();

  return (
    <form.Subscribe selector={(s) => s.values.item_id}>
      {(itemId) => {
        const item = masterItems.find((i) => i.item_id === itemId);
        return item?.unit_name ?? "-";
      }}
    </form.Subscribe>
  );
}
