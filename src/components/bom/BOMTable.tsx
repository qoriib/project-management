import { useEffect, useState } from "react";
import { Button, Divider, HStack, Table, Text, VStack } from "@astryxdesign/core";
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
import type { BOMDetail } from "@/db/repositories";

interface BOMTableProps {
  refreshTrigger?: number;
}

export function BOMTable({ refreshTrigger }: BOMTableProps) {
  const { boms, bomGroups = [], deleteBOM, loadBOMs } = useBOMStore(),
    [deleteTarget, setDeleteTarget] = useState<string | null>(null),
    [deleting, setDeleting] = useState(false),
    [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false),
    [isItemFormOpen, setIsItemFormOpen] = useState(false),
    [isPriceFormOpen, setIsPriceFormOpen] = useState(false),
    // State untuk form inline
    [editingId, setEditingId] = useState<string | null>(null),
    [editingData, setEditingData] = useState<BOMDetail | undefined>(),
    [editingGroupId, setEditingGroupId] = useState<string | undefined>(),
    selectedProjectId = useAppStore((s) => s.selectedProjectId),
    projects = useMasterStore((s) => s.projects),
    currentProject = projects.find((p) => p.project_id === selectedProjectId),
    isApproved = currentProject?.bom_is_approved === 1;

  useEffect(() => {
    if (selectedProjectId) {
      loadBOMs(selectedProjectId);
    }
  }, [refreshTrigger, selectedProjectId]);

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
      defaultGroupId: editingGroupId || "",
      initialData: editingData,
      onSuccess: () => {
        setEditingId(null);
        setEditingData(undefined);
        setEditingGroupId(undefined);
      },
    }),
    columns = useBOMColumns({
      editingId,
      form,
      handleItemChange,
      isApproved,
      items,
      setDeleteTarget,
      setEditingData,
      setEditingGroupId,
      setEditingId,
      setIsItemFormOpen,
      setIsPriceFormOpen,
    }),
    { grandTotal, groupedData, groupedPlugin, groupedIdKey, footerPlugin } = useBOMTableState({
      bomGroups,
      boms,
      editingId,
      isApproved,
      setEditingData,
      setEditingGroupId,
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
      <VStack>
        <Divider />
        <HStack justify="between" paddingBlock={3} gap={2}>
          {isApproved ? (
            <div />
          ) : (
            <Button
              variant="secondary"
              label="Kelola Grup Pekerjaan"
              onClick={() => setIsGroupDialogOpen(true)}
            />
          )}
          {boms.length > 0 && (
            <HStack justify="end" gap={2} style={{ flex: 1 }}>
              <Text weight="bold" size="lg">
                Total (Rp):
              </Text>
              <Text type="code" weight="bold" size="lg" color="primary">
                {formatNumber(grandTotal)}
              </Text>
            </HStack>
          )}
        </HStack>
      </VStack>
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
        onClose={() => {
          setIsPriceFormOpen(false);
          handleItemChange(form.getFieldValue("item_id"));
        }}
        item={(items.find((i: any) => i.item_id === form.getFieldValue("item_id")) as any) || null}
      />
    </>
  );
}
