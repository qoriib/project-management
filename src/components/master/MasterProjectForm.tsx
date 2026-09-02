import { useEffect } from "react";
import { Button, Dialog, HStack, Heading, TextInput } from "@astryxdesign/core";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
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

export type ProjectFormValues = v.InferOutput<typeof projectSchema>;

export function buildDefaultValues(initialData?: Project | null): ProjectFormValues {
  return {
    company_name: initialData?.company_name ?? "",
    fiscal_year: initialData?.fiscal_year ?? new Date().getFullYear(),
    project_name: initialData?.project_name ?? "",
  };
}

interface MasterProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Project | null;
}

export function MasterProjectForm({ isOpen, onClose, initialData }: MasterProjectFormProps) {
  const showToast = useToast();
  const { createProject, updateProject } = useMasterStore();

  const form = useForm({
    defaultValues: buildDefaultValues(initialData),
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
      form.reset(buildDefaultValues(initialData));
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
        <Layout
          header={
            <LayoutHeader hasDivider>
              <Heading level={3}>{initialData ? "Edit Proyek" : "Tambah Proyek"}</Heading>
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={4}>
              <FormLayout>
                <form.Field
                  name="project_name"
                  children={(field) => (
                    <TextInput
                      label="Nama Proyek"
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
                  name="company_name"
                  children={(field) => (
                    <TextInput
                      label="Nama Perusahaan"
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
                  name="fiscal_year"
                  children={(field) => (
                    <TextInput
                      label="Tahun Anggaran"
                      value={String(field.state.value || "")}
                      onChange={(val) => {
                        const digits = val.replaceAll(/\D/g, "").slice(0, 4);
                        field.handleChange(digits ? Number(digits) : (0 as unknown as number));
                      }}
                      onBlur={field.handleBlur}
                      isRequired
                      statusVariant="tooltip"
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                    />
                  )}
                />
              </FormLayout>
            </LayoutContent>
          }
          footer={
            <LayoutFooter hasDivider>
              <HStack gap={2} justify="end" width="100%">
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
            </LayoutFooter>
          }
        />
      </form>
    </Dialog>
  );
}
