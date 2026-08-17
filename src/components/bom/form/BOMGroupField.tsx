import { VStack, Selector } from "@astryxdesign/core";
import { getFieldError } from "@/utils/form";
import type { useBOMForm } from "./useBOMForm";

interface BOMGroupFieldProps {
  form: ReturnType<typeof useBOMForm>["form"];
  options: { value: string; label: string }[];
  isDisabled?: boolean;
}

/**
 * Field selector untuk memilih Grup BOM (Grup Pekerjaan).
 */
export function BOMGroupField({
  form,
  options,
  isDisabled,
}: BOMGroupFieldProps) {
  return (
    <VStack style={{ flex: 1 }}>
      <form.Field name="bom_group_id">
        {(field) => (
          <Selector
            label="Grup Pekerjaan"
            hasSearch
            placeholder="Pilih grup..."
            value={field.state.value}
            onChange={field.handleChange}
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
