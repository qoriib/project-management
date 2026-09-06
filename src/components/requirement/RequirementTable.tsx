import { useEffect, useState } from "react";
import { EmptyState, Table } from "@astryxdesign/core";
import { useTableStickyColumns } from "@astryxdesign/core/Table";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { RequirementItemDialog } from "@/components/requirement/RequirementItemDialog";
import { useAppStore } from "@/store/useAppStore";
import { useRequirementStore } from "@/store/useRequirementStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { type RequirementRow, useRequirementColumns } from "./table/useRequirementColumns";
import type { RequirementDetail } from "@/db/repositories";

export function RequirementTable() {
  const { requirements, deleteRequirement, loadRequirements } = useRequirementStore();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<RequirementDetail | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const projects = useMasterStore((s) => s.projects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const currentProject = projects.find((p) => p.project_id === selectedProjectId);
  const isApproved = currentProject?.requirements_is_approved === 1;

  // Listen for Ctrl+N shortcut dispatched by the parent route page.
  // Respects the isApproved guard — same as the table footer button.
  useEffect(() => {
    function handleOpen() {
      if (!isApproved) handleOpenAdd();
    }
    window.addEventListener("openRequirementCreate", handleOpen);
    return () => window.removeEventListener("openRequirementCreate", handleOpen);
  }, [isApproved]);

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

  function handleOpenAdd() {
    setEditingItem(undefined);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(item: RequirementDetail) {
    setEditingItem(item);
    setIsDialogOpen(true);
  }

  const columns = useRequirementColumns({
    onEdit: handleOpenEdit,
    setDeletingId,
    isApproved,
  });

  const rowIndexPlugin = useTableRowIndex<RequirementRow>({
    data: requirements as RequirementRow[],
    getRowKey: (item) => String(item.requirement_id),
  });

  const stickyColumns = useTableStickyColumns<RequirementRow>({
    startKeys: ["__rowIndex", "item_code", "item_name"],
  });

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={requirements as RequirementRow[]}
        idKey={(item) => String(item.requirement_id)}
        plugins={{ rowIndex: rowIndexPlugin, stickyColumns }}
        emptyState={<EmptyState isCompact title="Belum ada rencana kebutuhan (BOQ)" />}
      />
      <AlertDialog
        isOpen={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onAction={handleDelete}
        title="Hapus Kebutuhan"
        description="Hapus item ini dari rencana kebutuhan? Tindakan ini tidak dapat dibatalkan."
        actionLabel="Hapus"
        cancelLabel="Batal"
        isActionLoading={isDeleting}
      />
      <RequirementItemDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingItem(undefined);
        }}
        initialData={editingItem}
      />
    </>
  );
}
