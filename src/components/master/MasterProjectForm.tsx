import { useEffect, useState } from "react";
import { Dialog, TextInput, VStack, HStack, Button, Heading, Text } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@astryxdesign/core/Toast";
import { Banner } from "@astryxdesign/core/Banner";
import { projectRepo, type Project } from "@/db/repositories";
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
  const { createProject, updateProject } = useMasterStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const showToast = useToast();

  const [stages, setStages] = useState<{ stage_id?: number, stage_name: string, has_relation?: boolean }[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);

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
      setErrorMsg(null);
      try {
        const validStages = stages.filter(s => s.stage_name.trim() !== "");
        
        if (initialData) {
          await updateProject(initialData.project_id, value, validStages);
          showToast({ body: "Project berhasil diubah", type: "info" });
        } else {
          await createProject(value, validStages);
          showToast({ body: "Project berhasil ditambahkan", type: "info" });
        }
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal menyimpan project");
      }
    }
  });

  useEffect(() => {
    async function loadInitial() {
      if (isOpen) {
        setErrorMsg(null);
        form.reset();
        if (initialData) {
          form.setFieldValue("project_name", initialData.project_name);
          form.setFieldValue("company_name", initialData.company_name);
          form.setFieldValue("fiscal_year", initialData.fiscal_year);
          
          setLoadingStages(true);
          try {
            const fetched = await projectRepo.getStagesWithRelation(initialData.project_id);
            setStages(fetched.length > 0 ? fetched : [{ stage_name: "" }]);
          } catch (error) {
            setStages([{ stage_name: "" }]);
          } finally {
            setLoadingStages(false);
          }
        } else {
          form.setFieldValue("fiscal_year", new Date().getFullYear());
          setStages([{ stage_name: "" }]);
        }
      }
    }
    loadInitial();
  }, [isOpen, initialData]);

  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={600}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <VStack gap={3}>
          <Heading level={3}>{initialData ? "Edit Project" : "Tambah Project"}</Heading>

          {errorMsg && <Banner status="error" title="Gagal menyimpan" description={errorMsg} />}

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
                  status={getFieldError(field.state.meta.errors)}
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
                  status={getFieldError(field.state.meta.errors)}
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
                  statusVariant="attached"
                  status={getFieldError(field.state.meta.errors)}
                />
              )}
            />
          </FormLayout>

          <Heading level={4} style={{ marginTop: '1rem' }}>Tahapan Proyek</Heading>
          {loadingStages ? (
            <Text color="secondary">Memuat data tahap...</Text>
          ) : (
            <VStack gap={3}>
              {stages.map((s, idx) => (
                <HStack key={idx} gap={2} align="end">
                  <TextInput
                    label={`Nama Tahap ${idx + 1}`}
                    value={s.stage_name}
                    onChange={(val) => {
                      const newStages = [...stages];
                      newStages[idx].stage_name = val;
                      setStages(newStages);
                    }}
                    style={{ flex: 1 }}
                  />
                  {!s.has_relation && stages.length > 1 && (
                    <Button
                      variant="destructive"
                      label="✕"
                      onClick={() => setStages(stages.filter((_, i) => i !== idx))}
                      type="button"
                    />
                  )}
                </HStack>
              ))}

              <HStack>
                <Button
                  size="sm"
                  variant="secondary"
                  label="+ Tambah Tahap"
                  onClick={() => setStages([...stages, { stage_name: "" }])}
                  type="button"
                />
              </HStack>
            </VStack>
          )}

          <HStack gap={2} justify="end" style={{ marginTop: '1rem' }}>
            <Button variant="ghost" label="Batal" onClick={onClose} type="button" />
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              children={([canSubmit, isSubmitting]) => (
                <Button variant="primary" label="Simpan" type="submit" isLoading={isSubmitting} isDisabled={!canSubmit || loadingStages} />
              )}
            />
          </HStack>
        </VStack>
      </form>
    </Dialog>
  );
}
