import { useState, useCallback } from "react";
import { itemPriceRepo, type ItemPrice } from "@/db/repositories";

/**
 * Custom hook untuk mengelola cache harga item.
 * Mencegah fetch berulang untuk item yang sama dalam satu sesi form.
 */
export function usePriceCache() {
  const [priceCache, setPriceCache] = useState<Map<number, ItemPrice[]>>(new Map());

  /** Ambil harga untuk satu item; gunakan cache jika sudah ada */
  const getPricesForItem = useCallback(
    async (itemId: number): Promise<ItemPrice[]> => {
      const isCached = priceCache.has(itemId);

      if (isCached) {
        return priceCache.get(itemId)!;
      }

      const prices = await itemPriceRepo.findByItem(itemId);

      setPriceCache((prev) => {
        const next = new Map(prev);
        next.set(itemId, prices);
        return next;
      });

      return prices;
    },
    [priceCache]
  );

  /** Pre-load harga untuk banyak item sekaligus (dipakai saat mode edit) */
  const preloadPrices = useCallback(
    async (itemIds: number[]): Promise<Map<number, ItemPrice[]>> => {
      const cache = new Map<number, ItemPrice[]>();

      await Promise.all(
        itemIds.map(async (id) => {
          const prices = await itemPriceRepo.findByItem(id);
          cache.set(id, prices);
        })
      );

      setPriceCache(cache);
      return cache;
    },
    []
  );

  return { priceCache, getPricesForItem, preloadPrices };
}
