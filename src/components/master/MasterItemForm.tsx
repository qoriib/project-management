import { useEffect } from "react";
import { Dialog, TextInput, Selector, VStack, HStack, Button, Heading } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import type { ItemWithDetails } from "@/db/repositories";
import * as v from "valibot";

const itemSchema = v.object({
  item_name: v.pipe(v.string(), v.nonEmpty("Nama item harus diisi.")),
  category_id: v.pipe(v.string(), v.nonEmpty("Pilih kategori terlebih dahulu.")),
  unit_id: v.pipe(v.string(), v.nonEmpty("Pilih satuan terlebih dahulu."))
});

interface MasterItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ItemWithDetails | null;
}

export function MasterItemForm({ isOpen, onClose, initialData }: MasterItemFormProps) {
  const showToast = useToast();

  const { categories, units, createItem, updateItem } = useMasterStore();

  const form = useForm({
    defaultValues: {
      item_name: "",
      category_id: "",
      unit_id: "",
    },
    validators: {
      onChange: itemSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const data = {
          item_name: value.item_name,
          category_id: parseInt(value.category_id),
          unit_id: parseInt(value.unit_id)
        };

        if (initialData) {
          await updateItem(initialData.item_id, data);
          showToast({ body: "Item berhasil diubah", type: "info" });
        } else {
          await createItem(data);
          showToast({ body: "Item berhasil ditambahkan. Gunakan 'Harga' di tabel untuk menambahkan harga.", type: "info" });
        }
      } catch (error: any) {
        showToast({ body: error.message || "Terjadi kesalahan", type: "error" });
      } finally {
        onClose();
      }
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          item_name: initialData.item_name,
          category_id: String(initialData.category_id),
          unit_id: String(initialData.unit_id)
        });
      } else {
        form.reset({
          item_name: "",
          category_id: categories.length > 0 ? String(categories[0].category_id) : "",
          unit_id: units.length > 0 ? String(units[0].unit_id) : ""
        });
      }
    }
  }, [isOpen, initialData, categories, units]);

  const categoryOptions = categories.map((category) => ({
    value: String(category.category_id),
    label: category.category_name,
  }));

  const unitOptions = units.map((unit) => ({
    value: String(unit.unit_id),
    label: unit.unit_name,
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
              name="item_name"
              children={(field) => (
                <TextInput
                  label="Nama Item"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  isRequired
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                />
              )}
            />
            <form.Field
              name="category_id"
              children={(field) => (
                <Selector
                  label="Kategori"
                  placeholder="Pilih kategori..."
                  options={categoryOptions}
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                />
              )}
            />
            <form.Field
              name="unit_id"
              children={(field) => (
                <Selector
                  label="Satuan"
                  placeholder="Pilih satuan..."
                  options={unitOptions}
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                />
              )}
            />
          </FormLayout>
          <HStack gap={2} justify="end" style={{ marginTop: '1rem' }}>
            <Button variant="secondary" label="Batal" onClick={onClose} type="button" />
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              children={([canSubmit, isSubmitting]) => (
                <Button variant="primary" label="Simpan" type="submit" isLoading={isSubmitting} isDisabled={!canSubmit} />
              )}
            />
          </HStack>
        </VStack>
      </form>
    </Dialog>
  );
}
