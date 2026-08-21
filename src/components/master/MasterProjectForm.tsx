import { useEffect } from "react";
import { Button, Dialog, HStack, Heading, TextInput, VStack } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError, handleFormError } from "@/utils/form";
import { type Project } from "@/db/repositories";
import * as v from "valibot";

const projectSchema = v.object({
  company_name: v.pipe(v.string(), v.nonEmpty("Nama perusahaan harus diisi.")),
  fiscal_year: v.pipe(v.number(), v.minValue(1900, "Tahun fiskal tidak valid.")),
  project_name: v.pipe(v.string(), v.nonEmpty("Nama proyek harus diisi.")),
});

interface MasterProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Project | null;
}

export function MasterProjectForm({ isOpen, onClose, initialData }: MasterProjectFormProps) {
  const showToast = useToast();
  const { createProject, updateProject } = useMasterStore();

  const form = useForm({
    defaultValues: {
      company_name: "",
      fiscal_year: new Date().getFullYear(),
      project_name: "",
    },
    onSubmit: async ({ value }) => {
      try {
        if (initialData) {
          await updateProject(initialData.project_id, value);
        } else {
          await createProject(value);
        }
      } catch (error: any) {
        handleFormError(error, showToast);
      } finally {
        onClose();
      }
    },
    validators: {
      onChange: projectSchema,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          company_name: initialData.company_name,
          fiscal_year: initialData.fiscal_year,
          project_name: initialData.project_name,
        });
      } else {
        form.reset({
          company_name: "",
          fiscal_year: new Date().getFullYear(),
          project_name: "",
        });
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
          <Heading level={3}>{initialData ? "Edit Project" : "Tambah Project"}</Heading>
          <FormLayout>
            <form.Field
              name="project_name"
              children={(field) => (
                <TextInput
                  label="Nama Project"
                  placeholder="Contoh: Pembangunan Gedung A"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  isRequired
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                />
              )}
            />
            <form.Field
              name="company_name"
              children={(field) => (
                <TextInput
                  label="Nama Perusahaan"
                  placeholder="Contoh: PT Bangun Persada"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  onBlur={field.handleBlur}
                  isRequired
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                />
              )}
            />
            <form.Field
              name="fiscal_year"
              children={(field) => (
                <NumberInput
                  label="Tahun Fiskal"
                  placeholder="Contoh: 2026"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val || 0)}
                  onBlur={field.handleBlur}
                  isRequired
                  isIntegerOnly
                  statusVariant="attached"
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
                  variant="primary"
                  label="Simpan"
                  type="submit"
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
