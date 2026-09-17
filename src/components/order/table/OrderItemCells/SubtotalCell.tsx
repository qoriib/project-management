import { Text } from "@astryxdesign/core";
import { formatNumber, parseDecimalInput } from "@/utils/formatters";
import { useMasterStore } from "@/store/useMasterStore";
import type { CellFormProps } from "./types";

export function SubtotalCell({ form }: CellFormProps) {
  const { itemPricesMap } = useMasterStore();

  return (
    <form.Subscribe
      selector={(state) => ({
        itemId: state.values.item_id,
        priceId: state.values.item_price_id,
        qty: state.values.qty,
      })}
    >
      {({ qty, priceId, itemId }) => {
        let priceNum = 0;

        if (itemId && priceId) {
          const prices = itemPricesMap.get(itemId) ?? [];
          const priceObj = prices.find((priceItem) => String(priceItem.item_price_id) === String(priceId));
          if (priceObj) {
            priceNum = priceObj.price;
          }
        }

        const numQty = parseDecimalInput(qty);
        return <Text type="code">{formatNumber(numQty * priceNum, "currency")}</Text>;
      }}
    </form.Subscribe>
  );
}
