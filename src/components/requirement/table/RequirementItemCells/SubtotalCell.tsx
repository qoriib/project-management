import { formatNumber } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import type { BaseCellProps } from "./types";

export function SubtotalCell({ form }: BaseCellProps) {
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
          const priceObj = prices.find((p) => p.item_price_id === priceId);
          if (priceObj) {
            priceNum = priceObj.price;
          }
        }

        return <>{formatNumber(qty * priceNum)}</>;
      }}
    </form.Subscribe>
  );
}
