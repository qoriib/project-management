import { useEffect } from "react";
import { Dialog, TextInput, VStack, HStack, Button, Heading } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import type { ItemCategory } from "@/db/repositories";
import * as v from "valibot";

const categorySchema = v.object({
  prefix: v.pipe(v.string(), v.regex(/^[A-Za-z]$/, "Prefix harus berupa 1 huruf."), v.transform(val => val.toUpperCase())),
  category_code: v.optional(v.string(), ""),
  category_name: v.pipe(v.string(), v.nonEmpty("Nama kategori harus diisi.")),
});

interface MasterCategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ItemCategory | null;
}

export function MasterCategoryForm({ isOpen, onClose, initialData }: MasterCategoryFormProps) {
  const showToast = useToast();

  const { createCategory, updateCategory } = useMasterStore();

  const form = useForm({
    defaultValues: {
      prefix: "",
      category_code: "",
      category_name: "",
    },
    validators: {
      onChange: categorySchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (initialData) {
          await updateCategory(initialData.category_id, value);
          showToast({ body: "Kategori berhasil diubah", type: "info" });
        } else {
          await createCategory(value);
          showToast({ body: "Kategori berhasil ditambahkan", type: "info" });
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
      form.reset();

      if (initialData) {
        form.reset({
          prefix: initialData.prefix || "",
          category_code: initialData.category_code || "",
          category_name: initialData.category_name
        })
      }
    }
  }, [isOpen, initialData]);

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
          <Heading level={3}>{initialData ? "Edit Kategori" : "Tambah Kategori"}</Heading>
          <FormLayout>
            <form.Field
              name="prefix"
              children={(field) => (
                <TextInput
                  label="Prefix"
                  placeholder="Contoh: A"
                  maxLength={1}
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val.toUpperCase())}
                  onBlur={field.handleBlur}
                  isRequired
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                />
              )}
            />
            <form.Field
              name="category_code"
              children={(field) => (
                <TextInput
                  label="Kode Kategori (Opsional)"
                  placeholder="Kosongkan untuk auto-generate"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                />
              )}
            />
            <form.Field
              name="category_name"
              children={(field) => (
                <TextInput
                  label="Nama Kategori"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  isRequired
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
