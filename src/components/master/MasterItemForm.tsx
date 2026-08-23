import { useEffect, useMemo } from "react";
import { Button, Dialog, HStack, Heading, Selector, TextInput, VStack } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError, handleFormError } from "@/utils/form";
import { generateNextCode } from "@/utils/formatters";
import type { ItemWithDetails } from "@/db/repositories";
import * as v from "valibot";

const itemSchema = v.object({
  category_id: v.pipe(v.string(), v.nonEmpty("Pilih kategori terlebih dahulu.")),
  item_code: v.pipe(v.string(), v.nonEmpty("Kode item harus diisi.")),
  item_name: v.pipe(v.string(), v.nonEmpty("Nama item harus diisi.")),
  unit_id: v.pipe(v.string(), v.nonEmpty("Pilih satuan terlebih dahulu.")),
});

export type ItemFormValues = v.InferOutput<typeof itemSchema>;

export function buildDefaultValues(
  initialData?: ItemWithDetails | null,
  fallback?: { nextItemCode?: string; defaultCategoryId?: string; defaultUnitId?: string },
): ItemFormValues {
  return {
    category_id:
      initialData?.category_id != null ? String(initialData.category_id) : (fallback?.defaultCategoryId ?? ""),
    item_code: initialData?.item_code ?? fallback?.nextItemCode ?? "",
    item_name: initialData?.item_name ?? "",
    unit_id: initialData?.unit_id != null ? String(initialData.unit_id) : (fallback?.defaultUnitId ?? ""),
  };
}

interface MasterItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ItemWithDetails | null;
}

export function MasterItemForm({ isOpen, onClose, initialData }: MasterItemFormProps) {
  const showToast = useToast();
  const { items, categories, units, createItem, updateItem } = useMasterStore();

  const nextItemCode = useMemo(() => {
    if (initialData) return initialData.item_code || "";
    return generateNextCode(items.map((i) => i.item_code));
  }, [items, initialData]);

  const fallbackDefaults = useMemo(
    () => ({
      nextItemCode,
      defaultCategoryId: categories.length > 0 ? String(categories[0].category_id) : "",
      defaultUnitId: units.length > 0 ? String(units[0].unit_id) : "",
    }),
    [nextItemCode, categories, units],
  );

  const form = useForm({
    defaultValues: buildDefaultValues(initialData, fallbackDefaults),
    onSubmit: async ({ value }) => {
      try {
        const data = {
          item_code: value.item_code,
          item_name: value.item_name,
          category_id: value.category_id,
          unit_id: value.unit_id,
        };

        if (initialData) {
          await updateItem(initialData.item_id, data);
        } else {
          await createItem(data);
        }
      } catch (error: any) {
        handleFormError(error, showToast);
      } finally {
        onClose();
      }
    },
    validators: {
      onChange: itemSchema,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(buildDefaultValues(initialData, fallbackDefaults));
    }
  }, [isOpen, initialData, fallbackDefaults]);

  const categoryOptions = categories.map((category) => ({
    label: category.category_name,
    value: String(category.category_id),
  }));

  const unitOptions = units.map((unit) => ({
    label: unit.unit_name,
    value: String(unit.unit_id),
  }));

  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={520}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <VStack gap={3}>
          <Heading level={3}>{initialData ? "Edit Item" : "Tambah Item"}</Heading>
          <FormLayout>
            <form.Field
              name="item_code"
              children={(field) => (
                <TextInput
                  label="Kode Item"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  isRequired
                  statusVariant="tooltip"
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                />
              )}
            />
            <form.Field
              name="item_name"
              children={(field) => (
                <TextInput
                  label="Nama Item"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  isRequired
                  statusVariant="tooltip"
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                />
              )}
            />
            <form.Field
              name="category_id"
              children={(field) => (
                <Selector
                  label="Kategori"
                  options={categoryOptions}
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  hasSearch
                  searchPlaceholder="Cari kategori..."
                  statusVariant="tooltip"
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                />
              )}
            />
            <form.Field
              name="unit_id"
              children={(field) => (
                <Selector
                  label="Satuan"
                  options={unitOptions}
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  hasSearch
                  searchPlaceholder="Cari satuan..."
                  statusVariant="tooltip"
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                />
              )}
            />
            <HStack gap={2} justify="end">
              <Button variant="secondary" label="Batal" onClick={onClose} type="button" />
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    variant="primary"
                    label="Simpan"
                    type="submit"
                    isLoading={isSubmitting}
                    isDisabled={!canSubmit}
                  />
                )}
              />
            </HStack>
          </FormLayout>
        </VStack>
      </form>
    </Dialog>
  );
}
