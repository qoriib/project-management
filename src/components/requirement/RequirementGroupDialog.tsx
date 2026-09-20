import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  HStack,
  Heading,
  IconButton,
  InputGroup,
  InputGroupText,
  Switch,
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

interface GroupRow extends RequirementGroup, Record<string, unknown> {}

const groupSchema = v.object({
  group_name: v.pipe(
    v.string("Nama kelompok pekerjaan harus diisi."),
    v.trim(),
    v.nonEmpty("Nama kelompok pekerjaan harus diisi."),
  ),
  has_detail: v.boolean(),
  budget: v.string(),
});

interface RequirementGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newGroupId: string) => void;
}

export function RequirementGroupDialog({ isOpen, onClose, onSuccess }: RequirementGroupDialogProps) {
  const showToast = useToast();
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const projects = useMasterStore((state) => state.projects);
  const currentProject = projects.find((project) => project.project_id === selectedProjectId);
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
      has_detail: false,
      budget: "",
    },
    validators: {
      onChange: groupSchema,
      onSubmitAsync: async ({ value }) => {
        if (!selectedProjectId) return null;

        const trimmed = value.group_name.trim();
        if (!trimmed) return null;
        const isPagu = Boolean(value.has_detail);
        const budgetVal = parseDecimalInput(value.budget);
        const finalBudget = isPagu ? (budgetVal > 0 ? budgetVal : null) : null;

        try {
          if (editingGroup) {
            await updateGroup(editingGroup.requirement_group_id, trimmed, isPagu, finalBudget);
            setEditingGroup(null);
          } else {
            const createdId = await createGroup(selectedProjectId, trimmed, isPagu, finalBudget);
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
      form.reset({ group_name: "", has_detail: false, budget: "" });
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
      form.reset({ group_name: "", has_detail: false, budget: "" });
      loadGroups(selectedProjectId);
    }
  }, [isOpen, selectedProjectId, loadGroups]);

  function handleStartEdit(group: RequirementGroup) {
    setEditingGroup(group);
    form.setFieldValue("group_name", group.group_name);
    form.setFieldValue("has_detail", Boolean(group.has_detail));
    form.setFieldValue("budget", group.budget && group.budget > 0 ? String(group.budget).replace(".", ",") : "");
  }

  function handleCancelEdit() {
    setEditingGroup(null);
    form.reset({ group_name: "", has_detail: false, budget: "" });
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
      header: "Pagu",
      key: "has_detail",
      width: pixel(100),
      renderCell: (row: RequirementGroup) =>
        row.has_detail ? <Badge variant="warning" label="Pagu" /> : <Text color="secondary">-</Text>,
    },
    {
      align: "end",
      header: "Anggaran (Rp)",
      key: "budget",
      width: pixel(180),
      renderCell: (row: RequirementGroup) => {
        if (!row.has_detail) {
          return <Text color="secondary">-</Text>;
        }
        if (row.budget && row.budget > 0) {
          return <Text type="code">Rp {formatNumber(row.budget, "currency")}</Text>;
        }
        return <Text color="secondary">(Tanpa Budget)</Text>;
      },
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
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={720} maxHeight="85vh">
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
                  onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
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
                          name="has_detail"
                          children={(field) => (
                            <Switch
                              label="Kelompok Pagu Anggaran"
                              description="Aktifkan jika pekerjaan ini menggunakan sistem pagu anggaran (bukan rincian item BOQ)"
                              value={field.state.value}
                              onChange={(checked) => field.handleChange(checked)}
                              isDisabled={isApproved}
                            />
                          )}
                        />
                        <form.Subscribe
                          selector={(state) => state.values.has_detail}
                          children={(isPagu) =>
                            isPagu ? (
                              <form.Field
                                name="budget"
                                children={(field) => (
                                  <InputGroup label="Nominal Pagu Anggaran (Opsional)">
                                    <InputGroupText>Rp</InputGroupText>
                                    <TextInput
                                      label="Nominal Pagu Anggaran"
                                      isLabelHidden
                                      placeholder="Kosongkan jika pagu tanpa batas/nominal budget"
                                      value={field.state.value}
                                      onChange={(val) => field.handleChange(sanitizeDecimalInput(val ?? ""))}
                                      onBlur={field.handleBlur}
                                      isDisabled={isApproved}
                                    />
                                  </InputGroup>
                                )}
                              />
                            ) : null
                          }
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
