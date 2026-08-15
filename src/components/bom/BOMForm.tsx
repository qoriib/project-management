import { HStack, VStack, Button, Selector } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { getFieldError } from "@/utils/form";
import { buildItemOptions } from "./form/bom.utils";
import { useBOMForm } from "./form/useBOMForm";
import type { BOMFormProps } from "./form/bom.schema";

export type { BOMFormProps };

// ── BOMForm ───────────────────────────────────────────────────────────────────

/**
 * Form inline untuk menambah atau mengedit satu baris BOM.
 * Semua logic ada di `useBOMForm`; komponen ini hanya bertanggung jawab pada UI.
 */
export function BOMForm({
  stageId,
  initialData,
  isDisabled,
  onSuccess,
  onCancel,
}: BOMFormProps) {
  const {
    form,
    priceOptions,
    items,
    existingBoms,
    selectedProjectId,
    handleItemChange,
  } = useBOMForm({ stageId, initialData, onSuccess });

  const itemOptions = buildItemOptions(items, existingBoms, initialData);

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
            {/* ── Selector: Material / Alat ── */}
            <VStack style={{ flex: 1 }}>
              <form.Field
                name="item_id"
                children={(field) => (
                  <Selector
                    label="Material / Alat"
                    hasSearch
                    value={field.state.value}
                    onChange={(val) => handleItemChange(val)}
                    onBlur={field.handleBlur}
                    statusVariant="attached"
                    status={getFieldError(
                      field.state.meta.errors,
                      !!field.state.meta.isTouched
                    )}
                    options={itemOptions}
                    isDisabled={isDisabled}
                  />
                )}
              />
            </VStack>

            {/* ── Input: Volume Rencana ── */}
            <VStack width={200}>
              <form.Field
                name="qty"
                children={(field) => (
                  <NumberInput
                    label="Volume Rencana"
                    placeholder="Contoh: 1500"
                    value={field.state.value || null}
                    onChange={(val) => field.handleChange(val || 0)}
                    onBlur={field.handleBlur}
                    statusVariant="attached"
                    status={getFieldError(
                      field.state.meta.errors,
                      !!field.state.meta.isTouched
                    )}
                    isDisabled={isDisabled}
                  />
                )}
              />
            </VStack>

            {/* ── Selector: Harga ── */}
            <VStack width={260}>
              <form.Field
                name="item_price_id"
                children={(field) => (
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
                    options={[
                      {
                        value: "",
                        label:
                          priceOptions.length === 0
                            ? "Pilih item dahulu..."
                            : "Pilih harga...",
                      },
                      ...priceOptions,
                    ]}
                    isDisabled={
                      isDisabled || !formItemId || priceOptions.length === 0
                    }
                  />
                )}
              />
            </VStack>

            {/* ── Action Buttons ── */}
            <VStack style={{ paddingTop: "24px" }}>
              <HStack gap={2}>
                <Button
                  variant="primary"
                  label={initialData ? "Simpan" : "Tambah"}
                  type="submit"
                  isLoading={isSubmitting}
                  isDisabled={isDisabled || !canSubmit || !selectedProjectId}
                />
                {initialData && (
                  <Button
                    variant="secondary"
                    label="Batal"
                    onClick={onCancel}
                  />
                )}
              </HStack>
            </VStack>
          </HStack>
        )}
      />
    </form>
  );
}
