import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, VStack, HStack, Button, Text, Table, Badge, IconButton, Heading, Card } from "@astryxdesign/core";
import { TextInput } from "@astryxdesign/core";
import { useToast } from "@astryxdesign/core/Toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { pixel, proportional } from "@astryxdesign/core/Table";
import { projectRepo, type StageRelation, type Project } from "@/db/repositories";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import * as v from "valibot";

const stageSchema = v.object({
  stage_name: v.pipe(v.string(), v.nonEmpty("Nama tahap harus diisi.")),
});

interface MasterProjectStageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export function MasterProjectStageDialog({ isOpen, onClose, project }: MasterProjectStageDialogProps) {
  const showToast = useToast();

  const [stages, setStages] = useState<StageRelation[]>([]);
  const [loading, setLoading] = useState(false);

  const [editTarget, setEditTarget] = useState<StageRelation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StageRelation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm({
    defaultValues: {
      stage_name: "",
    },
    validators: {
      onChange: stageSchema,
    },
    onSubmit: async ({ value }) => {
      if (!project) return;

      const name = value.stage_name.trim();
      if (!name) return;

      try {
        if (editTarget) {
          await projectRepo.saveStages(project.project_id, [
            ...stages.map(s =>
              s.stage_id === editTarget.stage_id
                ? { stage_id: s.stage_id, stage_name: name }
                : { stage_id: s.stage_id, stage_name: s.stage_name }
            )
          ]);
          showToast({ body: "Tahap berhasil diubah.", type: "info" });
        } else {
          await projectRepo.saveStages(project.project_id, [
            ...stages.map(s => ({ stage_id: s.stage_id, stage_name: s.stage_name })),
            { stage_name: name }
          ]);
          showToast({ body: "Tahap berhasil ditambahkan.", type: "info" });
        }

        form.reset();
        setEditTarget(null);
        await loadStages();
      } catch (err: any) {
        showToast({ body: err.message || "Gagal menyimpan tahap.", type: "error" });
      }
    }
  });

  async function loadStages() {
    if (!project) return;

    setLoading(true);

    try {
      const data = await projectRepo.getStagesWithRelation(project.project_id);
      setStages(data);
    } catch {
      setStages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && project) {
      form.reset();
      setEditTarget(null);
      loadStages();
    }
  }, [isOpen, project]);

  function startEdit(stage: StageRelation) {
    setEditTarget(stage);
    form.setFieldValue("stage_name", stage.stage_name);
  }

  function cancelEdit() {
    setEditTarget(null);
    form.reset();
  }

  async function handleDelete() {
    if (!deleteTarget || !project) return;
    setDeleting(true);
    try {
      // Remove the target stage, keep all others
      await projectRepo.saveStages(
        project.project_id,
        stages
          .filter(s => s.stage_id !== deleteTarget.stage_id)
          .map(s => ({ stage_id: s.stage_id, stage_name: s.stage_name }))
      );
      showToast({ body: "Tahap berhasil dihapus.", type: "info" });
      setDeleteTarget(null);
      await loadStages();
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus tahap.", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "stage_id",
      header: "#",
      width: pixel(60),
      renderCell: (row: StageRelation) => (
        <Text size="sm" color="secondary">{String(row.stage_id).padStart(3, "0")}</Text>
      ),
    },
    {
      key: "stage_name",
      header: "Nama Tahap",
      width: proportional(1),
      renderCell: (row: StageRelation) => (
        <HStack gap={2} align="center">
          <Text size="sm">{row.stage_name}</Text>
          {row.has_relation && <Badge variant="neutral" label="Aktif" />}
        </HStack>
      ),
    },
    {
      key: "actions",
      header: "",
      width: pixel(100),
      renderCell: (row: StageRelation) => {
        const locked = row.has_relation;
        return (
          <HStack justify="end" gap={1}>
            <IconButton size="sm"
              variant="secondary"
              icon={<Pencil size={16} />} label="Edit"
              onClick={() => startEdit(row)}
            />
            <IconButton size="sm"
              variant="destructive"
              icon={<Trash2 size={16} />} label="Hapus"
              onClick={() => setDeleteTarget(row)}
              isDisabled={locked}
            />
          </HStack>
        );
      },
    },
  ];

  return (
    <>
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={560}>
        <VStack gap={4}>
          <HStack justify="between" align="center">
            <Heading level={3}>Tahap: {project?.project_name}</Heading>
            <IconButton variant="secondary" icon={<X size={20} />} label="Tutup" onClick={onClose} />
          </HStack>

          <Card>
            {loading ? (
              <VStack align="center" padding={4}>
                <Text size="sm" color="secondary">Memuat data tahap...</Text>
              </VStack>
            ) : (
              <Table
                columns={columns as any}
                data={stages as any}
                idKey="stage_id"
                textOverflow="truncate"
                emptyState={<TableEmptyState message="Belum ada tahap. Tambahkan di bawah." />}
              />
            )}
          </Card>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <Card>
              <VStack gap={3}>
                <FormLayout>
                  <form.Field
                    name="stage_name"
                    children={(field) => (
                      <TextInput
                        label="Nama Tahap"
                        placeholder="Contoh: Perencanaan"
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
                <HStack justify="end" gap={2}>
                  {editTarget && (
                    <Button type="button" variant="secondary" label="Batal" onClick={cancelEdit} />
                  )}
                  <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                    children={([canSubmit, isSubmitting]) => (
                      <Button
                        type="submit"
                        variant="primary"
                        label={editTarget ? "Simpan" : "Tambah"}
                        isLoading={isSubmitting}
                        isDisabled={!canSubmit}
                      />
                    )}
                  />
                </HStack>
              </VStack>
            </Card>
          </form>
        </VStack>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Tahap"
        message={`Hapus tahap "${deleteTarget?.stage_name}"? Tahap yang sudah memiliki BOM tidak bisa dihapus.`}
        isLoading={deleting}
      />
    </>
  );
}
