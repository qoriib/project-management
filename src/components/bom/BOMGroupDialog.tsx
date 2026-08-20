import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Dialog,
  HStack,
  IconButton,
  Table,
  VStack,
} from "@astryxdesign/core";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { useToast } from "@astryxdesign/core/Toast";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { bomGroupRepo } from "@/db/repositories";
import { useForm } from "@tanstack/react-form";
import { getFieldError, handleFormError } from "@/utils/form";
import { useBOMStore } from "@/store/useBOMStore";
import {
  type TableColumn,
  pixel,
  proportional,
} from "@astryxdesign/core/Table";
import type { BOMGroup, ProjectWithRelations } from "@/db/repositories";
import * as v from "valibot";

interface GroupRow extends BOMGroup, Record<string, unknown> {}

const bomGroupSchema = v.object({
  group_name: v.pipe(
    v.string(),
    v.nonEmpty("Nama grup pekerjaan harus diisi."),
  ),
});

interface BOMGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectWithRelations | null;
}

export function BOMGroupDialog({
  isOpen,
  onClose,
  project,
}: BOMGroupDialogProps) {
  const showToast = useToast();
  const [editTarget, setEditTarget] = useState<BOMGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BOMGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { boms, bomGroups, loadBOMs } = useBOMStore();

  const form = useForm({
    defaultValues: {
      group_name: "",
    },
    onSubmit: async ({ value }) => {
      if (!project) return;

      try {
        if (editTarget) {
          await bomGroupRepo.update(editTarget.bom_group_id, {
            group_name: value.group_name,
          });
        } else {
          await bomGroupRepo.create({
            project_id: project.project_id,
            group_name: value.group_name,
          });
        }
        form.reset();
        setEditTarget(null);
        await loadGroups();
      } catch (err: any) {
        handleFormError(err, showToast);
      }
    },
    validators: {
      onChange: bomGroupSchema,
    },
  });

  async function loadGroups() {
    if (!project) {
      return;
    }
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
    if (!deleteTarget || !project) {
      return;
    }
    setDeleting(true);
    try {
      await bomGroupRepo.delete(deleteTarget.bom_group_id);
      setDeleteTarget(null);
      await loadGroups();
    } catch (error: any) {
      handleFormError(error, showToast);
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<GroupRow>[] = [
    {
      header: "No.",
      key: "no",
      width: pixel(60),
      renderCell: (row: BOMGroup) => {
        const index = bomGroups.findIndex(
          (g) => g.bom_group_id === row.bom_group_id,
        );
        return index >= 0 ? index + 1 : "-";
      },
    },
    {
      header: "Nama Grup Pekerjaan",
      key: "group_name",
      width: proportional(1),
      renderCell: (row: BOMGroup) => {
        return (
          <HStack gap={2} align="center">
            <span>{row.group_name}</span>
          </HStack>
        );
      },
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(100),
      renderCell: (row: BOMGroup) => {
        const isUsed = boms.some((b) => b.bom_group_id === row.bom_group_id);
        return (
          <HStack justify="end" gap={1}>
            <IconButton
              size="sm"
              variant="secondary"
              label="Edit"
              icon={<Pencil size={16} />}
              onClick={() => startEdit(row)}
            />
            {isUsed ? (
              <Tooltip content="Grup ini sedang digunakan dan tidak bisa dihapus.">
                <IconButton
                  size="sm"
                  variant="destructive"
                  label="Hapus"
                  icon={<Trash2 size={16} />}
                  onClick={() => setDeleteTarget(row)}
                  isDisabled={true}
                />
              </Tooltip>
            ) : (
              <IconButton
                size="sm"
                variant="destructive"
                label="Hapus"
                icon={<Trash2 size={16} />}
                onClick={() => setDeleteTarget(row)}
                isDisabled={false}
              />
            )}
          </HStack>
        );
      },
    },
  ];

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose()}
        width={560}
      >
        <VStack gap={4}>
          <PageHeader
            title="Grup Pekerjaan"
            actions={
              <IconButton
                variant="secondary"
                icon={<X size={20} />}
                label="Tutup"
                onClick={onClose}
              />
            }
          />
          <Table
            columns={columns}
            data={bomGroups as GroupRow[]}
            idKey="bom_group_id"
            textOverflow="truncate"
            emptyState={
              <TableEmptyState message="Belum ada grup pekerjaan. Tambahkan di bawah." />
            }
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
                        status={getFieldError(
                          field.state.meta.errors,
                          field.state.meta.isTouched,
                        )}
                      />
                    )}
                  />
                </FormLayout>
                <HStack justify="end" gap={2}>
                  {editTarget && (
                    <Button
                      type="button"
                      variant="secondary"
                      label="Batal"
                      onClick={cancelEdit}
                    />
                  )}
                  <form.Subscribe
                    selector={(state) =>
                      [state.canSubmit, state.isSubmitting] as const
                    }
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
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Grup Pekerjaan"
        message={`Hapus grup pekerjaan "${deleteTarget?.group_name}"?`}
        isLoading={deleting}
      />
    </>
  );
}
