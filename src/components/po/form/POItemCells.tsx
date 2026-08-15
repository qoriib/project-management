import { Selector } from "@astryxdesign/core";
import { useMasterStore } from "@/store/useMasterStore";
import { formatRupiah } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import type { usePOForm } from "./usePOForm";
import type { ItemPrice, Vendor } from "@/db/repositories";
import type { DashboardBOMReportItem } from "@/db/services";

export interface CellFormProps {
  form: ReturnType<typeof usePOForm>["form"];
  idx: number;
}

interface ItemSelectorCellProps extends CellFormProps {
  bomOptions: DashboardBOMReportItem[];
  selectedItemIds: Set<number>;
}

export function ItemSelectorCell({
  form,
  idx,
  bomOptions,
  selectedItemIds,
}: ItemSelectorCellProps) {
  const loadItemPrices = useMasterStore((s) => s.loadItemPrices);

  return (
    <form.Field name={`items[${idx}].item_id`}>
      {(field) => {
        const currentVal = Number(field.state.value);

        const options = bomOptions
          .filter(
            (b) => b.item_id === currentVal || !selectedItemIds.has(b.item_id)
          )
          .map((b) => ({
            value: String(b.item_id),
            label: `${b.item_name} (${b.unit})`,
          }));

        const handleChange = async (v: string) => {
          const id = Number(v);
          field.handleChange(id);

          if (id) {
            await loadItemPrices(id);

            const bomItem = bomOptions.find((b) => b.item_id === id);
            const bomItemPrice = bomItem?.item_price_id ? String(bomItem.item_price_id) : ""

            form.setFieldValue(`items[${idx}].item_price_id`, bomItemPrice);
          } else {
            form.setFieldValue(`items[${idx}].item_price_id`, "");
          }
        };

        return (
          <Selector
            label="Item"
            isLabelHidden
            hasSearch
            placeholder="Pilih Item..."
            statusVariant="tooltip"
            value={String(field.state.value)}
            options={options}
            onChange={handleChange}
            onBlur={field.handleBlur}
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
      {(field) => {
        const options = prices.map((p) => ({
          value: String(p.item_price_id),
          label: formatRupiah(p.price),
        }));

        const handleChange = (v: string) => field.handleChange(v);

        return (
          <Selector
            label="Harga"
            isLabelHidden
            placeholder={
              !itemId
                ? "Pilih item dahulu..."
                : prices.length === 0
                  ? "Belum ada harga"
                  : "Pilih harga..."
            }
            options={options}
            value={field.state.value}
            onChange={handleChange}
            onBlur={field.handleBlur}
            statusVariant="tooltip"
            status={getFieldError(
              field.state.meta.errors,
              !!field.state.meta.isTouched
            )}
            isDisabled={!itemId || prices.length === 0}
          />
        );
      }}
    </form.Field>
  );
}

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
      {(field) => {
        const options = vendors.map((v) => ({
          value: String(v.vendor_id),
          label: v.vendor_name,
        }));

        const handleChange = (v: string) => field.handleChange(v);

        return (
          <Selector
            label="Vendor"
            isLabelHidden
            placeholder="Pilih vendor..."
            options={options}
            value={field.state.value}
            onChange={handleChange}
            onBlur={field.handleBlur}
            statusVariant="tooltip"
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
