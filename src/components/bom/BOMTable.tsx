import { useEffect, useMemo, useState } from "react";
import { Button, HStack, Table, Text } from "@astryxdesign/core";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { BOMGroupDialog } from "@/components/bom/BOMGroupDialog";
import { MasterItemForm } from "@/components/master/MasterItemForm";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { formatNumber } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";
import { useBOMStore } from "@/store/useBOMStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useBOMForm } from "./form/useBOMForm";
import { useBOMColumns } from "./table/useBOMColumns";
import { useBOMTableState } from "./table/useBOMTableState";

export function BOMTable() {
  const { boms, bomGroups, deleteBOM, loadBOMs } = useBOMStore();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingData = useMemo(() => {
    if (!editingId) {
      return undefined;
    }

    return boms.find((b) => b.bom_id === editingId);
  }, [boms, editingId]);

  const editingGroupId = useMemo(() => {
    if (editingId?.startsWith("new-")) {
      return editingId.replace("new-", "");
    }

    return editingData?.bom_group_id;
  }, [editingId, editingData]);

  const projects = useMasterStore((s) => s.projects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const currentProject = projects.find((p) => p.project_id === selectedProjectId);
  const isApproved = currentProject?.bom_is_approved === 1;

  useEffect(() => {
    if (selectedProjectId) {
      loadBOMs(selectedProjectId);
    }
  }, [selectedProjectId]);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await deleteBOM(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const { form, items, handleItemChange } = useBOMForm({
    defaultGroupId: editingGroupId ?? "",
    initialData: editingData,
    onSuccess: () => {
      setEditingId(null);
    },
  });

  const columns = useBOMColumns({
    boms,
    editingId,
    form,
    handleItemChange,
    isApproved,
    items,
    setDeleteTarget,
    setEditingId,
    setIsItemFormOpen,
    setIsPriceFormOpen,
  });

  const { grandTotal, groupedData, groupedPlugin, groupedIdKey, footerPlugin } = useBOMTableState({
    bomGroups,
    boms,
    editingId,
    isApproved,
    setEditingId,
  });

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={groupedData}
        idKey={groupedIdKey}
        plugins={{ footer: footerPlugin, grouping: groupedPlugin }}
        emptyState={
          <TableEmptyState message="Belum ada rencana material di proyek ini. Harap siapkan Grup Pekerjaan melalui tombol di bawah." />
        }
      />

      <HStack align="start" justify="between" paddingBlock={3} gap={2}>
        {isApproved ? null : (
          <Button
            variant="secondary"
            label="Kelola Grup Pekerjaan"
            onClick={() => setIsGroupDialogOpen(true)}
          />
        )}
        {boms.length > 0 && (
          <HStack justify="end" gap={2} width="100%">
            <Text type="code" weight="bold" size="lg" color="primary">
              {formatNumber(grandTotal)}
            </Text>
          </HStack>
        )}
      </HStack>
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kebutuhan"
        message="Apakah Anda yakin ingin menghapus material ini dari rencana (BOM)?"
        isLoading={deleting}
      />
      <BOMGroupDialog
        isOpen={isGroupDialogOpen}
        onClose={() => setIsGroupDialogOpen(false)}
        project={currentProject || null}
      />
      <MasterItemForm
        isOpen={isItemFormOpen}
        onClose={() => setIsItemFormOpen(false)}
        initialData={null}
      />
      <MasterItemPriceDialog
        isOpen={isPriceFormOpen}
        item={items.find((i) => i.item_id === form.getFieldValue("item_id")) || null}
        onClose={() => {
          setIsPriceFormOpen(false);
          handleItemChange(form.getFieldValue("item_id"));
        }}
      />
    </>
  );
}
