import { VStack, Selector } from "@astryxdesign/core";
import { getFieldError } from "@/utils/form";
import type { useBOMForm } from "./useBOMForm";

interface BOMItemFieldProps {
  form: ReturnType<typeof useBOMForm>["form"];
  options: { value: string; label: string }[];
  isDisabled?: boolean;
  onItemChange: (val: string) => void;
}

/**
 * Field selector untuk memilih Item pada form BOM.
 */
export function BOMItemField({
  form,
  options,
  isDisabled,
  onItemChange,
}: BOMItemFieldProps) {
  return (
    <VStack style={{ flex: 1 }}>
      <form.Field name="item_id">
        {(field) => (
          <Selector
            label="Item Kebutuhan"
            hasSearch
            placeholder="Pilih item..."
            value={field.state.value}
            onChange={onItemChange}
            onBlur={field.handleBlur}
            statusVariant="attached"
            status={getFieldError(
              field.state.meta.errors,
              !!field.state.meta.isTouched
            )}
            options={options}
            isDisabled={isDisabled}
          />
        )}
      </form.Field>
    </VStack>
  );
}
