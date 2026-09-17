import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  HStack,
  Heading,
  IconButton,
  InputGroup,
  InputGroupText,
  Table,
  Text,
  TextInput,
  VStack,
} from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { useToast } from "@astryxdesign/core/Toast";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useForm } from "@tanstack/react-form";
import { getFieldError, handleFormError } from "@/utils/form";
import { formatNumber, parseDecimalInput, sanitizeDecimalInput } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useRequirementGroupStore } from "@/store/useRequirementGroupStore";
import { type TableColumn, pixel, proportional, useTablePagination, paginateData } from "@astryxdesign/core/Table";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import type { RequirementGroup } from "@/db/repositories";
import * as v from "valibot";

interface GroupRow extends RequirementGroup, Record<string, unknown> { }

const groupSchema = v.object({
  group_name: v.pipe(
    v.string("Nama kelompok pekerjaan harus diisi."),
    v.trim(),
    v.nonEmpty("Nama kelompok pekerjaan harus diisi."),
  ),
  budget: v.string(),
});

interface RequirementGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newGroupId: string) => void;
}

export function RequirementGroupDialog({ isOpen, onClose, onSuccess }: RequirementGroupDialogProps) {
  const showToast = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useMasterStore((s) => s.projects);
  const currentProject = projects.find((p) => p.project_id === selectedProjectId);
  const isApproved = currentProject?.requirements_is_approved === 1;

  const { groups, loadGroups, createGroup, updateGroup, deleteGroup } = useRequirementGroupStore();

  const [editingGroup, setEditingGroup] = useState<RequirementGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RequirementGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const form = useForm({
    defaultValues: {
      group_name: "",
      budget: "",
    },
    validators: {
      onChange: groupSchema,
      onSubmitAsync: async ({ value }) => {
        if (!selectedProjectId) return null;

        const trimmed = value.group_name.trim();
        if (!trimmed) return null;
        const budgetVal = parseDecimalInput(value.budget);
        const finalBudget = budgetVal > 0 ? budgetVal : null;

        try {
          if (editingGroup) {
            await updateGroup(editingGroup.requirement_group_id, trimmed, finalBudget);
            setEditingGroup(null);
          } else {
            const createdId = await createGroup(selectedProjectId, trimmed, finalBudget);
            if (onSuccess && createdId) {
              onSuccess(createdId);
            }
          }
          return null;
        } catch (error: unknown) {
          handleFormError(error, showToast);
          return null;
        }
      },
    },
    onSubmit: async () => {
      form.reset({ group_name: "", budget: "" });
      setEditingGroup(null);
      if (selectedProjectId) {
        await loadGroups(selectedProjectId);
      }
    },
  });

  useEffect(() => {
    if (isOpen && selectedProjectId) {
      setPage(1);
      setEditingGroup(null);
      form.reset({ group_name: "", budget: "" });
      loadGroups(selectedProjectId);
    }
  }, [isOpen, selectedProjectId, loadGroups]);

  function handleStartEdit(group: RequirementGroup) {
    setEditingGroup(group);
    form.setFieldValue("group_name", group.group_name);
    form.setFieldValue("budget", group.budget && group.budget > 0 ? String(group.budget).replace(".", ",") : "");
  }

  function handleCancelEdit() {
    setEditingGroup(null);
    form.reset({ group_name: "", budget: "" });
  }

  async function handleDelete() {
    if (!deleteTarget || !selectedProjectId) return;

    setDeleting(true);
    try {
      await deleteGroup(deleteTarget.requirement_group_id);
      showToast({ body: `Pekerjaan "${deleteTarget.group_name}" berhasil dihapus`, type: "info" });
      setDeleteTarget(null);
      if (editingGroup?.requirement_group_id === deleteTarget.requirement_group_id) {
        handleCancelEdit();
      }
      await loadGroups(selectedProjectId);
    } catch (error: unknown) {
      handleFormError(error, showToast);
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<GroupRow>[] = [
    {
      header: "Nama Pekerjaan",
      key: "group_name",
      width: proportional(1),
      renderCell: (row: RequirementGroup) => (
        <Text weight="medium" maxLines={1}>
          {row.group_name}
        </Text>
      ),
    },
    {
      align: "end",
      header: "Pagu Anggaran (Rp)",
      key: "budget",
      width: pixel(180),
      renderCell: (row: RequirementGroup) =>
        row.budget && row.budget > 0 ? <Text type="code">Rp {formatNumber(row.budget, 2)}</Text> : "-",
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(100),
      renderCell: (row: RequirementGroup) => (
        <HStack justify="end" gap={1}>
          {isApproved ? (
            <Tooltip content="Kebutuhan proyek telah disetujui, tidak dapat diubah.">
              <IconButton
                size="sm"
                variant="secondary"
                icon={<Pencil />}
                label="Ubah"
                onClick={() => handleStartEdit(row)}
                isDisabled={true}
              />
            </Tooltip>
          ) : (
            <IconButton
              size="sm"
              variant="secondary"
              icon={<Pencil />}
              label="Ubah"
              onClick={() => handleStartEdit(row)}
              isDisabled={false}
            />
          )}

          {isApproved ? (
            <Tooltip content="Kebutuhan proyek telah disetujui, tidak dapat dihapus.">
              <IconButton
                size="sm"
                variant="destructive"
                icon={<Trash2 />}
                label="Hapus"
                onClick={() => setDeleteTarget(row)}
                isDisabled={true}
              />
            </Tooltip>
          ) : (
            <IconButton
              size="sm"
              variant="destructive"
              icon={<Trash2 />}
              label="Hapus"
              onClick={() => setDeleteTarget(row)}
              isDisabled={false}
            />
          )}
        </HStack>
      ),
    },
  ];

  const paginatedGroups = useMemo(() => {
    return paginateData(groups, page, pageSize);
  }, [groups, page, pageSize]);

  const paginationPlugin = useTablePagination<GroupRow>({
    page,
    onPageChange: setPage,
    totalItems: groups.length,
    pageSize,
    variant: "pages",
    size: "sm",
  });

  const rowIndexPlugin = useTableRowIndex({
    data: paginatedGroups as GroupRow[],
    getRowKey: (item) => item.requirement_group_id,
    startFrom: (page - 1) * pageSize + 1,
  });

  return (
    <>
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={680} maxHeight="85vh">
        <Layout
          header={
            <LayoutHeader hasDivider>
              <HStack justify="between" align="center" width="100%">
                <Heading level={3}>Kelola Pekerjaan</Heading>
                <IconButton variant="secondary" icon={<X />} label="Tutup" onClick={onClose} />
              </HStack>
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={4}>
              <VStack gap={4}>
                <Table
                  idKey="requirement_group_id"
                  textOverflow="truncate"
                  columns={columns}
                  plugins={{ rowIndex: rowIndexPlugin, pagination: paginationPlugin }}
                  data={paginatedGroups as GroupRow[]}
                  emptyState={<EmptyState isCompact title="Belum ada kelompok pekerjaan" />}
                />
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
                          name="group_name"
                          children={(field) => (
                            <TextInput
                              isRequired
                              label="Nama Pekerjaan"
                              value={field.state.value}
                              onChange={(val) => field.handleChange(val ?? "")}
                              onBlur={field.handleBlur}
                              isDisabled={isApproved}
                              statusVariant="tooltip"
                              status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                            />
                          )}
                        />
                        <form.Field
                          name="budget"
                          children={(field) => (
                            <InputGroup label="Pagu Anggaran">
                              <InputGroupText>Rp</InputGroupText>
                              <TextInput
                                label="Pagu Anggaran"
                                isLabelHidden
                                placeholder="Kosongkan jika dihitung dari item"
                                value={field.state.value}
                                onChange={(val) => field.handleChange(sanitizeDecimalInput(val ?? ""))}
                                onBlur={field.handleBlur}
                                isDisabled={isApproved}
                              />
                            </InputGroup>
                          )}
                        />
                      </FormLayout>
                      <HStack justify="end" gap={2} width="100%">
                        {editingGroup ? <Button variant="secondary" label="Batal" onClick={handleCancelEdit} /> : null}
                        <form.Subscribe
                          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                          children={([canSubmit, isSubmitting]) => (
                            <Button
                              type="submit"
                              variant="primary"
                              label={editingGroup ? "Simpan Perubahan" : "Tambah Pekerjaan"}
                              isLoading={isSubmitting}
                              isDisabled={!canSubmit || isApproved}
                            />
                          )}
                        />
                      </HStack>
                    </VStack>
                  </Card>
                </form>
              </VStack>
            </LayoutContent>
          }
        />
      </Dialog>
      <AlertDialog
        title="Hapus Kelompok Pekerjaan"
        description={`Hapus pekerjaan "${deleteTarget?.group_name ?? ""}"? Pastikan tidak ada item kebutuhan atau pesanan yang terhubung.`}
        actionLabel="Hapus"
        cancelLabel="Batal"
        isOpen={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onAction={handleDelete}
        isActionLoading={deleting}
      />
    </>
  );
}
