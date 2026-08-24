import { useEffect, useState } from "react";
import { Table } from "@astryxdesign/core";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { RequirementItemDialog } from "@/components/requirement/RequirementItemDialog";
import { useAppStore } from "@/store/useAppStore";
import { useRequirementStore } from "@/store/useRequirementStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useRequirementColumns } from "./table/useRequirementColumns";
import { useRequirementTableState } from "./table/useRequirementTableState";
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

  const { dataWithFooters, footerPlugin, rowIndexPlugin } = useRequirementTableState({
    requirements,
    isApproved,
    onAdd: handleOpenAdd,
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
        emptyState={<TableEmptyState message="Belum ada rencana Item di proyek ini." />}
      />
      <AlertDialog
        isOpen={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onAction={handleDelete}
        title="Hapus Kebutuhan"
        description="Apakah Anda yakin ingin menghapus Item ini dari rencana?"
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
