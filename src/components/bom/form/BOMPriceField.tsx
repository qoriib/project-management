import { VStack, Selector } from "@astryxdesign/core";
import { getFieldError } from "@/utils/form";
import type { useBOMForm } from "./useBOMForm";

interface BOMPriceFieldProps {
  form: ReturnType<typeof useBOMForm>["form"];
  priceOptions: { value: string; label: string }[];
  formItemId: string;
  isDisabled?: boolean;
}

/**
 * Field selector untuk memilih variasi harga pada form BOM.
 * Dinonaktifkan apabila belum ada item yang dipilih.
 */
export function BOMPriceField({
  form,
  priceOptions,
  formItemId,
  isDisabled,
}: BOMPriceFieldProps) {
  const hasNoPrice = priceOptions.length === 0;

  const placeholderLabel = hasNoPrice
    ? "Pilih item dahulu..."
    : "Pilih harga...";

  const placeholderOption = { value: "", label: placeholderLabel };

  const isFieldDisabled = isDisabled || !formItemId || hasNoPrice;

  return (
    <VStack width={260}>
      <form.Field name="item_price_id">
        {(field) => (
          <Selector
            label="Harga"
            value={field.state.value}
            onChange={(val) => field.handleChange(val)}
            onBlur={field.handleBlur}
            statusVariant="attached"
            status={getFieldError(
              field.state.meta.errors,
              !!field.state.meta.isTouched
            )}
            options={[placeholderOption, ...priceOptions]}
            isDisabled={isFieldDisabled}
          />
        )}
      </form.Field>
    </VStack>
  );
}
