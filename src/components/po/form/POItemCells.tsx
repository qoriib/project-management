/**
 * POItemCells — Input cells untuk form PO:
 * ItemSelectorCell, PriceSelectorCell, VendorSelectorCell
 */
import { Selector } from "@astryxdesign/core";
import type { ItemPrice, Vendor } from "@/db/repositories";
import type { DashboardBOMReportItem } from "@/db/services";
import { formatRupiah } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import type { usePOForm } from "./usePOForm";

/** Shared prop untuk cell yang memerlukan form instance dan index baris */
export interface CellFormProps {
  form: ReturnType<typeof usePOForm>["form"];
  idx: number;
}

// ── ItemSelectorCell ──────────────────────────────────────────────────────────

interface ItemSelectorCellProps extends CellFormProps {
  bomOptions: DashboardBOMReportItem[];
  selectedItemIds: Set<number>;
  getPricesForItem: (itemId: number) => Promise<ItemPrice[]>;
}

export function ItemSelectorCell({
  form,
  idx,
  bomOptions,
  selectedItemIds,
  getPricesForItem,
}: ItemSelectorCellProps) {
  return (
    <form.Field name={`items[${idx}].item_id`}>
      {(field) => {
        const currentVal = Number(field.state.value);
        return (
          <Selector
            label="Barang"
            isLabelHidden
            options={[
              { value: "0", label: "Pilih Material..." },
              ...bomOptions
                .filter(
                  (b) =>
                    b.item_id === currentVal || !selectedItemIds.has(b.item_id)
                )
                .map((b) => ({
                  value: String(b.item_id),
                  label: `${b.item_name} (${b.unit})`,
                })),
            ]}
            value={String(field.state.value)}
            onChange={async (v: string) => {
              const id = Number(v);
              field.handleChange(id);
              if (id) {
                await getPricesForItem(id);
                const bomItem = bomOptions.find((b) => b.item_id === id);
                form.setFieldValue(
                  `items[${idx}].item_price_id`,
                  bomItem?.item_price_id ? String(bomItem.item_price_id) : ""
                );
              } else {
                form.setFieldValue(`items[${idx}].item_price_id`, "");
              }
            }}
            onBlur={field.handleBlur}
            statusVariant="attached"
            status={getFieldError(
              field.state.meta.errors,
              !!field.state.meta.isTouched
            )}
          />
        );
      }}
    </form.Field>
  );
}

// ── PriceSelectorCell ─────────────────────────────────────────────────────────

interface PriceSelectorCellProps extends CellFormProps {
  itemId: number;
  prices: ItemPrice[];
}

export function PriceSelectorCell({
  form,
  idx,
  itemId,
  prices,
}: PriceSelectorCellProps) {
  return (
    <form.Field name={`items[${idx}].item_price_id`}>
      {(field) => (
        <Selector
          label="Harga"
          isLabelHidden
          options={[
            {
              value: "",
              label: itemId
                ? prices.length === 0
                  ? "Belum ada harga"
                  : "Pilih harga..."
                : "Pilih item dahulu...",
            },
            ...prices.map((p) => ({
              value: String(p.item_price_id),
              label: formatRupiah(p.price),
            })),
          ]}
          value={field.state.value}
          onChange={(v: string) => field.handleChange(v)}
          onBlur={field.handleBlur}
          statusVariant="attached"
          status={getFieldError(
            field.state.meta.errors,
            !!field.state.meta.isTouched
          )}
          isDisabled={!itemId || prices.length === 0}
        />
      )}
    </form.Field>
  );
}

// ── VendorSelectorCell ────────────────────────────────────────────────────────

interface VendorSelectorCellProps extends CellFormProps {
  vendors: Vendor[];
}

export function VendorSelectorCell({
  form,
  idx,
  vendors,
}: VendorSelectorCellProps) {
  return (
    <form.Field name={`items[${idx}].vendor_id`}>
      {(field) => (
        <Selector
          label="Vendor"
          isLabelHidden
          options={[
            { value: "", label: "Pilih vendor..." },
            ...vendors.map((v) => ({
              value: String(v.vendor_id),
              label: v.vendor_name,
            })),
          ]}
          value={field.state.value}
          onChange={(v: string) => field.handleChange(v)}
          onBlur={field.handleBlur}
          statusVariant="attached"
          status={getFieldError(
            field.state.meta.errors,
            !!field.state.meta.isTouched
          )}
        />
      )}
    </form.Field>
  );
}
