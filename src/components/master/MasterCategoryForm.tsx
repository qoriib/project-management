import { useEffect, useState } from "react";
import { Dialog, TextInput, VStack, HStack, Button, Heading } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { Banner } from "@astryxdesign/core/Banner";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import type { ItemCategory } from "@/db/repositories";
import * as v from "valibot";

const categorySchema = v.object({
  category_name: v.pipe(v.string(), v.nonEmpty("Nama kategori harus diisi.")),
});

interface MasterCategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ItemCategory | null;
}

export function MasterCategoryForm({ isOpen, onClose, initialData }: MasterCategoryFormProps) {
  const { createCategory, updateCategory } = useMasterStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const showToast = useToast();

  const form = useForm({
    defaultValues: {
      category_name: "",
    },
    validators: {
      onChange: categorySchema,
    },
    onSubmit: async ({ value }) => {
      setErrorMsg(null);
      try {
        if (initialData) {
          await updateCategory(initialData.category_id, value);
          showToast({ body: "Kategori berhasil diubah", type: "info" });
        } else {
          await createCategory(value);
          showToast({ body: "Kategori berhasil ditambahkan", type: "info" });
        }
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal menyimpan kategori");
      }
    }
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      form.reset();
      if (initialData) {
        form.setFieldValue("category_name", initialData.category_name);
      }
    }
  }, [isOpen, initialData]); // removed form from dep array as it is stable

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

          {errorMsg && <Banner status="error" title="Gagal menyimpan" description={errorMsg} />}

          <FormLayout>
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
                  status={getFieldError(field.state.meta.errors)}
                />
              )}
            />
          </FormLayout>

          <HStack gap={2} justify="end" style={{ marginTop: '1rem' }}>
            <Button variant="ghost" label="Batal" onClick={onClose} type="button" />
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
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
