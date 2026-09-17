import { EntityCode } from "@/components/shared/EntityCode";
import { formatItemCode } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import type { CellFormProps } from "./types";

export function ItemCodeDisplayCell({ form }: CellFormProps) {
  const { items: masterItems } = useMasterStore();

  return (
    <form.Subscribe selector={(state) => state.values.item_id}>
      {(itemId) => {
        const item = masterItems.find((masterItem) => masterItem.item_id === itemId);

        if (!item) return "-";

        const code = formatItemCode(item);

        return <EntityCode id={code} />;
      }}
    </form.Subscribe>
  );
}
