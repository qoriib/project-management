import { EntityCode } from "@/components/shared/EntityCode";
import { formatItemCode } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import type { CellFormProps } from "./types";

export function ItemCodeDisplayCell({ form }: CellFormProps) {
  const { items: masterItems } = useMasterStore();

  return (
    <form.Subscribe selector={(s) => s.values.item_id}>
      {(itemId) => {
        const item = masterItems.find((i) => i.item_id === itemId);

        if (!item) return "-";

        const code = formatItemCode(item);

        return <EntityCode id={code} />;
      }}
    </form.Subscribe>
  );
}
