import { useEffect, useMemo, useState } from "react";
import { HStack, Table, Text } from "@astryxdesign/core";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { MasterItemForm } from "@/components/master/MasterItemForm";
import { MasterItemPriceDialog } from "@/components/master/MasterItemPriceDialog";
import { formatNumber } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";
import { useRequirementStore } from "@/store/useRequirementStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useRequirementForm } from "./form/useRequirementForm";
import { useRequirementColumns } from "./table/useRequirementColumns";
import { useRequirementTableState } from "./table/useRequirementTableState";

export function RequirementTable() {
  const { requirements, deleteRequirement, loadRequirements } = useRequirementStore();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);

  const editingData = useMemo(
    () => (editingId && editingId !== "new" ? requirements.find((r) => r.requirement_id === editingId) : undefined),
    [requirements, editingId],
  );

  const projects = useMasterStore((s) => s.projects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const currentProject = projects.find((p) => p.project_id === selectedProjectId);
  const isApproved = currentProject?.requirements_is_approved === 1;

  useEffect(() => {
    if (selectedProjectId) loadRequirements(selectedProjectId);
  }, [selectedProjectId, loadRequirements]);

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteRequirement(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const { form, items, handleItemChange } = useRequirementForm({
    initialData: editingData,
    onSuccess: () => setEditingId(null),
  });

  const columns = useRequirementColumns({
    form,
    items,
    isApproved,
    editingId,
    setDeletingId,
    setEditingId,
    handleItemChange,
    setIsItemFormOpen,
    setIsPriceFormOpen,
  });

  const { grandTotal, dataWithFooters, footerPlugin, rowIndexPlugin } = useRequirementTableState({
    requirements,
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
        data={dataWithFooters}
        idKey={(item) => String(item.requirement_id)}
        plugins={{ footer: footerPlugin, rowIndex: rowIndexPlugin }}
        emptyState={<TableEmptyState message="Belum ada rencana material di proyek ini." />}
      />
      {requirements.length > 0 && (
        <HStack justify="end" paddingBlock={3}>
          <Text type="code" weight="bold" size="lg" color="primary">
            {formatNumber(grandTotal)}
          </Text>
        </HStack>
      )}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Kebutuhan"
        message="Apakah Anda yakin ingin menghapus material ini dari rencana?"
        isLoading={isDeleting}
      />
      <MasterItemForm isOpen={isItemFormOpen} onClose={() => setIsItemFormOpen(false)} initialData={null} />
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
