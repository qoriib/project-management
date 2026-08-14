import { useEffect } from "react";
import { Dialog, TextInput, VStack, HStack, Button, Heading } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import type { Unit } from "@/db/repositories";
import * as v from "valibot";

const unitSchema = v.object({
  unit_name: v.pipe(v.string(), v.nonEmpty("Nama satuan harus diisi.")),
});

interface MasterUnitFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Unit | null;
}

export function MasterUnitForm({ isOpen, onClose, initialData }: MasterUnitFormProps) {
  const showToast = useToast();

  const { createUnit, updateUnit } = useMasterStore();

  const form = useForm({
    defaultValues: {
      unit_name: "",
    },
    validators: {
      onChange: unitSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (initialData) {
          await updateUnit(initialData.unit_id, value);
          showToast({ body: "Satuan berhasil diubah", type: "info" });
        } else {
          await createUnit(value);
          showToast({ body: "Satuan berhasil ditambahkan", type: "info" });
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
        form.setFieldValue("unit_name", initialData.unit_name);
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
          <Heading level={3}>{initialData ? "Edit Satuan" : "Tambah Satuan"}</Heading>
          <FormLayout>
            <form.Field
              name="unit_name"
              children={(field) => (
                <TextInput
                  label="Nama Satuan"
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
