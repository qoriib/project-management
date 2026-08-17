import { HStack } from "@astryxdesign/core";
import { buildItemOptions } from "./form/bom.utils";
import { useBOMForm } from "./form/useBOMForm";
import { BOMItemField } from "./form/BOMItemField";
import { BOMGroupField } from "./form/BOMGroupField";
import { BOMQtyField } from "./form/BOMQtyField";
import { BOMPriceField } from "./form/BOMPriceField";
import { BOMFormActions } from "./form/BOMFormActions";
import type { BOMFormProps } from "./form/bom.schema";
export type { BOMFormProps };

/**
 * Form inline untuk menambah atau mengedit satu baris BOM.
 * Semua logic ada di `useBOMForm`; komponen ini hanya mengkomposisikan field-field.
 */
export function BOMForm({
  initialData,
  isDisabled,
  onSuccess,
  onCancel,
}: BOMFormProps) {
  const {
    form,
    priceOptions,
    items,
    bomGroups,
    existingBoms,
    selectedProjectId,
    handleItemChange,
  } = useBOMForm({ initialData, onSuccess });

  const itemOptions = buildItemOptions(items, existingBoms, initialData);
  const groupOptions = bomGroups.map(g => ({ value: g.bom_group_id, label: g.group_name }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Subscribe
        selector={(state) =>
          [state.values.item_id, state.canSubmit, state.isSubmitting] as const
        }
        children={([formItemId, canSubmit, isSubmitting]) => (
          <HStack gap={3} align="start" padding={3}>
            <BOMGroupField
              form={form}
              options={groupOptions}
              isDisabled={isDisabled}
            />
            <BOMItemField
              form={form}
              options={itemOptions}
              isDisabled={isDisabled}
              onItemChange={handleItemChange}
            />
            <BOMQtyField
              form={form}
              isDisabled={isDisabled}
            />
            <BOMPriceField
              form={form}
              priceOptions={priceOptions}
              formItemId={formItemId}
              isDisabled={isDisabled}
            />
            <BOMFormActions
              initialData={initialData}
              canSubmit={canSubmit}
              isSubmitting={isSubmitting}
              isDisabled={isDisabled}
              selectedProjectId={selectedProjectId}
              onCancel={onCancel}
            />
          </HStack>
        )}
      />
    </form>
  );
}
