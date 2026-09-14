import { useEffect, useState } from "react";
import { EmptyState, HStack, Table, Text } from "@astryxdesign/core";
import { useTableGroupedRows, useTableStickyColumns } from "@astryxdesign/core/Table";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { RequirementItemDialog } from "@/components/requirement/RequirementItemDialog";
import { useAppStore } from "@/store/useAppStore";
import { useRequirementStore } from "@/store/useRequirementStore";
import { useRequirementGroupStore } from "@/store/useRequirementGroupStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useTableGroupRowPlugin } from "@/components/shared/useTableGroupRowPlugin";
import { useRequirementGroupedData } from "./table/useRequirementGroupedData";
import { type RequirementRow, useRequirementColumns } from "./table/useRequirementColumns";
import type { RequirementDetail } from "@/db/repositories";

export function RequirementTable() {
  const { requirements, deleteRequirement, loadRequirements } = useRequirementStore();
  const { groups, loadGroups: loadRequirementGroups } = useRequirementGroupStore();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<RequirementDetail | undefined>(undefined);
  const [preselectedGroupId, setPreselectedGroupId] = useState<string | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const projects = useMasterStore((s) => s.projects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const currentProject = projects.find((p) => p.project_id === selectedProjectId);
  const isApproved = currentProject?.requirements_is_approved === 1;

  // Listen for Ctrl+N shortcut dispatched by the parent route page.
  useEffect(() => {
    function handleOpen() {
      if (!isApproved) handleOpenAdd();
    }
    window.addEventListener("openRequirementCreate", handleOpen);
    return () => window.removeEventListener("openRequirementCreate", handleOpen);
  }, [isApproved]);

  useEffect(() => {
    if (selectedProjectId) {
      loadRequirements(selectedProjectId);
      loadRequirementGroups(selectedProjectId);
    }
  }, [selectedProjectId, loadRequirements, loadRequirementGroups]);

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

  function handleOpenAdd(groupId?: string) {
    setEditingItem(undefined);
    setPreselectedGroupId(groupId);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(item: RequirementDetail) {
    setEditingItem(item);
    setPreselectedGroupId(item.requirement_group_id || undefined);
    setIsDialogOpen(true);
  }

  const columns = useRequirementColumns({
    onEdit: handleOpenEdit,
    setDeletingId,
    isApproved,
  });

  const { displayRequirements, groupOrder } = useRequirementGroupedData(requirements, groups);

  const {
    data: groupedData,
    plugin: groupedPlugin,
    idKey: groupedIdKey,
  } = useTableGroupedRows<RequirementRow>({
    collapsedGroups,
    data: displayRequirements,
    getRowKey: (item) => String(item.requirement_id),
    groupBy: (item) => item.group_name ?? "",
    groupOrder,
    onToggleGroup: (key: string) => {
      setCollapsedGroups((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    renderGroupHeader: (groupName: string) => (
      <HStack paddingInline={2} align="center">
        <Text weight="bold">{groupName}</Text>
      </HStack>
    ),
  });

  const stickyColumns = useTableStickyColumns<RequirementRow>({
    startKeys: ["item_code", "item_name"],
    endKeys: isApproved ? undefined : ["actions"],
  });

  const groupRowPlugin = useTableGroupRowPlugin<RequirementRow>();

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={groupedData}
        idKey={groupedIdKey}
        plugins={{
          grouping: groupedPlugin,
          stickyColumns,
          groupRow: groupRowPlugin,
        }}
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
          setPreselectedGroupId(undefined);
        }}
        initialData={editingItem}
        initialGroupId={preselectedGroupId}
      />
    </>
  );
}
