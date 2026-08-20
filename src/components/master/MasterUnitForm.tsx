import { useEffect } from "react";
import { Button, Dialog, HStack, Heading, TextInput, VStack } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError, handleFormError } from "@/utils/form";
import * as v from "valibot";
import type { Unit } from "@/db/repositories";

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
    onSubmit: async ({ value }) => {
      try {
        if (initialData) {
          await updateUnit(initialData.unit_id, value);
        } else {
          await createUnit(value);
        }
      } catch (error: any) {
        handleFormError(error, showToast);
      } finally {
        onClose();
      }
    },
    validators: {
      onChange: unitSchema,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          unit_name: initialData.unit_name,
        });
      } else {
        form.reset();
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
                  isRequired
                  label="Nama Satuan"
                  statusVariant="attached"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                />
              )}
            />
          </FormLayout>
          <HStack gap={2} justify="end">
            <Button variant="secondary" label="Batal" onClick={onClose} type="button" />
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  variant="primary"
                  label="Simpan"
                  isLoading={isSubmitting}
                  isDisabled={!canSubmit}
                />
              )}
            />
          </HStack>
        </VStack>
      </form>
    </Dialog>
  );
}
