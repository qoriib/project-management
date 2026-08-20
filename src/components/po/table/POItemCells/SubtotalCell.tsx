import { Text } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import type { CellFormProps } from "./types";

export function SubtotalCell({ form }: CellFormProps) {
  const { itemPricesMap } = useMasterStore();

  return (
    <form.Subscribe
      selector={(s) => ({
        itemId: s.values.item_id,
        priceId: s.values.item_price_id,
        qty: s.values.qty,
      })}
    >
      {({ qty, priceId, itemId }) => {
        let priceNum = 0;

        if (itemId && priceId) {
          const prices = itemPricesMap.get(itemId) ?? [];
          const priceObj = prices.find((p) => String(p.item_price_id) === String(priceId));
          if (priceObj) {
            priceNum = priceObj.price;
          }
        }

        return <Text type="code">{formatNumber((qty || 0) * priceNum)}</Text>;
      }}
    </form.Subscribe>
  );
}
