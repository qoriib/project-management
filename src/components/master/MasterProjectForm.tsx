import { useEffect } from "react";
import { Dialog, TextInput, VStack, HStack, Button, Heading } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { type Project } from "@/db/repositories";
import { useMasterStore } from "@/store/useMasterStore";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import * as v from "valibot";

const projectSchema = v.object({
  project_name: v.pipe(v.string(), v.nonEmpty("Nama proyek harus diisi.")),
  company_name: v.pipe(v.string(), v.nonEmpty("Nama perusahaan harus diisi.")),
  fiscal_year: v.pipe(v.number(), v.minValue(1900, "Tahun fiskal tidak valid.")),
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
      project_name: "",
      company_name: "",
      fiscal_year: new Date().getFullYear(),
    },
    validators: {
      onChange: projectSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (initialData) {
          await updateProject(initialData.project_id, value, []);
          showToast({ body: "Project berhasil diubah", type: "info" });
        } else {
          await createProject(value, []);
          showToast({ body: "Project berhasil ditambahkan. Buka ' Tahap' untuk menambahkan tahapan.", type: "info" });
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
          project_name: initialData.project_name,
          company_name: initialData.company_name,
          fiscal_year: initialData.fiscal_year,
        });
      } else {
        form.reset({
          project_name: "",
          company_name: "",
          fiscal_year: new Date().getFullYear(),
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
              name="company_name"
              children={(field) => (
                <TextInput
                  label="Nama Perusahaan"
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
              name="fiscal_year"
              children={(field) => (
                <NumberInput
                  label="Tahun Fiskal"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val || 0)}
                  onBlur={field.handleBlur}
                  isRequired
                  isIntegerOnly
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
