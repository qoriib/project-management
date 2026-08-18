import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, VStack, HStack, Button, Table, IconButton, Card, Badge } from "@astryxdesign/core";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useToast } from "@astryxdesign/core/Toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { pixel, proportional, type TableColumn } from "@astryxdesign/core/Table";
import { bomGroupRepo } from "@/db/repositories";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import type { BOMGroup, ProjectWithRelations } from "@/db/repositories";
import * as v from "valibot";
import { useBOMStore } from "@/store/useBOMStore";

type GroupRow = BOMGroup & Record<string, unknown>;

const bomGroupSchema = v.object({
  group_name: v.pipe(v.string(), v.nonEmpty("Nama grup pekerjaan harus diisi.")),
});

interface BOMGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectWithRelations | null;
}

export function BOMGroupDialog({ isOpen, onClose, project }: BOMGroupDialogProps) {
  const showToast = useToast();

  const [editTarget, setEditTarget] = useState<BOMGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BOMGroup | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { boms, bomGroups, loadBOMs } = useBOMStore();

  const form = useForm({
    defaultValues: {
      group_name: "",
    },
    validators: {
      onChange: bomGroupSchema,
    },
    onSubmit: async ({ value }) => {
      if (!project) return;

      try {
        if (editTarget) {
          await bomGroupRepo.update(editTarget.bom_group_id, { group_name: value.group_name });
          showToast({ body: "Grup pekerjaan berhasil diubah.", type: "info" });
        } else {
          await bomGroupRepo.create({ project_id: project.project_id, group_name: value.group_name });
          showToast({ body: "Grup pekerjaan berhasil ditambahkan.", type: "info" });
        }

        form.reset();
        setEditTarget(null);
        await loadGroups();
      } catch (err: any) {
        showToast({ body: err.message || "Gagal menyimpan grup pekerjaan.", type: "error" });
      }
    }
  });

  async function loadGroups() {
    if (!project) return;
    await loadBOMs(project.project_id);
  }

  useEffect(() => {
    if (isOpen && project) {
      form.reset();
      setEditTarget(null);
      loadGroups();
    }
  }, [isOpen, project]);

  function startEdit(group: BOMGroup) {
    setEditTarget(group);
    form.setFieldValue("group_name", group.group_name);
  }

  function cancelEdit() {
    setEditTarget(null);
    form.reset();
  }

  async function handleDelete() {
    if (!deleteTarget || !project) return;
    setDeleting(true);
    try {
      await bomGroupRepo.delete(deleteTarget.bom_group_id);
      showToast({ body: "Grup pekerjaan berhasil dihapus.", type: "info" });
      setDeleteTarget(null);
      await loadGroups();
    } catch (err: any) {
      // Typically we handle foreign key errors here if the group is already used in BOMs
      showToast({ body: err.message || "Gagal menghapus grup pekerjaan.", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<GroupRow>[] = [
    {
      key: "group_name",
      header: "Nama Grup Pekerjaan",
      width: proportional(1),
      renderCell: (row: BOMGroup) => {
        const isUsed = boms.some(b => b.bom_group_id === row.bom_group_id);
        return (
          <HStack gap={2} align="center">
            <span>{row.group_name}</span>
            {isUsed && <Badge variant="info" label="Digunakan" />}
          </HStack>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: pixel(100),
      renderCell: (row: BOMGroup) => {
        const isUsed = boms.some(b => b.bom_group_id === row.bom_group_id);
        return (
          <HStack justify="end" gap={1}>
            <IconButton size="sm" variant="secondary" icon={<Pencil size={16} />} label="Edit" onClick={() => startEdit(row)} />
            <IconButton size="sm"
              variant="destructive"
              icon={<Trash2 size={16} />} label="Hapus"
              onClick={() => setDeleteTarget(row)}
              isDisabled={isUsed}
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
          <PageHeader
            title={`Grup Pekerjaan: ${project?.project_name}`}
            actions={<IconButton variant="secondary" icon={<X size={20} />} label="Tutup" onClick={onClose} />}
          />
          <Table
            columns={columns}
            data={bomGroups as GroupRow[]}
            idKey="bom_group_id"
            textOverflow="truncate"
            emptyState={<TableEmptyState message="Belum ada grup pekerjaan. Tambahkan di bawah." />}
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <Card padding={4}>
              <VStack gap={3}>
                <FormLayout>
                  <form.Field
                    name="group_name"
                    children={(field) => (
                      <TextInput
                        label="Nama Grup Pekerjaan"
                        placeholder="Contoh: Pekerjaan Persiapan"
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val ?? "")}
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
        title="Hapus Grup Pekerjaan"
        message={`Hapus grup pekerjaan "${deleteTarget?.group_name}"? Grup yang masih digunakan di BOM tidak bisa dihapus.`}
        isLoading={deleting}
      />
    </>
  );
}
