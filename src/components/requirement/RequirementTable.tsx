import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, Table, AlertDialog } from "@astryxdesign/core";
import { RequirementItemDialog } from "@/components/requirement/RequirementItemDialog";
import { useAppStore } from "@/store/useAppStore";
import { useRequirementStore } from "@/store/useRequirementStore";
import { useRequirementGroupStore } from "@/store/useRequirementGroupStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useRequirementGroupedData } from "./table/useRequirementGroupedData";
import { buildPaguItemMap, mergeMixedTableData, usePaguRowPlugin } from "./table/requirementTableUtils";
import { RequirementGroupHeader } from "./table/RequirementGroupHeader";
import { type TablePlugin, useTableGroupedRows, useTableStickyColumns } from "@astryxdesign/core/Table";
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

  const handleOpenAdd = useCallback((groupId?: string) => {
    setEditingItem(undefined);
    setPreselectedGroupId(groupId);
    setIsDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((item: RequirementDetail) => {
    setEditingItem(item);
    setPreselectedGroupId(item.requirement_group_id || undefined);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingItem(undefined);
    setPreselectedGroupId(undefined);
  }, []);

  const handleToggleGroup = useCallback((groupKey: string) => {
    setCollapsedGroups((previousCollapsed) => {
      const updatedCollapsed = new Set(previousCollapsed);
      if (updatedCollapsed.has(groupKey)) {
        updatedCollapsed.delete(groupKey);
      } else {
        updatedCollapsed.add(groupKey);
      }
      return updatedCollapsed;
    });
  }, []);

  // Listen for Ctrl+N shortcut dispatched by the parent route page
  useEffect(() => {
    function handleShortcutOpen() {
      if (!isApproved) {
        handleOpenAdd();
      }
    }
    window.addEventListener("openRequirementCreate", handleShortcutOpen);
    return () => window.removeEventListener("openRequirementCreate", handleShortcutOpen);
  }, [isApproved, handleOpenAdd]);

  useEffect(() => {
    if (selectedProjectId) {
      loadRequirements(selectedProjectId);
      loadRequirementGroups(selectedProjectId);
    }
  }, [selectedProjectId, loadRequirements, loadRequirementGroups]);

  async function handleDeleteConfirm() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteRequirement(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns = useRequirementColumns({
    onEdit: handleOpenEdit,
    setDeletingId,
    isApproved,
  });

  const { displayRequirements, groupOrder, sortedGroups, hasNonPaguGroups } = useRequirementGroupedData(
    requirements,
    groups,
  );

  const nonPaguItems = useMemo(
    () => displayRequirements.filter((item) => !item.is_pagu_account),
    [displayRequirements],
  );

  const paguItemMap = useMemo(() => buildPaguItemMap(displayRequirements), [displayRequirements]);

  const {
    data: groupedData,
    plugin: groupedPlugin,
    idKey: groupedIdKey,
  } = useTableGroupedRows<RequirementRow>({
    collapsedGroups,
    data: nonPaguItems,
    getRowKey: (item) => String(item.requirement_id),
    groupBy: (item) => item.group_name ?? "",
    groupOrder,
    onToggleGroup: handleToggleGroup,
    renderGroupHeader: (groupName) => <RequirementGroupHeader groupName={groupName} />,
  });

  const finalTableData = useMemo(
    () =>
      mergeMixedTableData({
        hasNonPaguGroups,
        displayRequirements,
        sortedGroups,
        paguItemMap,
        groupedData,
      }),
    [hasNonPaguGroups, displayRequirements, sortedGroups, paguItemMap, groupedData],
  );

  const stickyColumns = useTableStickyColumns<RequirementRow>({
    startKeys: ["item_code", "item_name"],
    endKeys: isApproved ? undefined : ["actions"],
  });

  const paguRowPlugin = usePaguRowPlugin();

  const tablePlugins = useMemo<Record<string, TablePlugin<RequirementRow>>>(() => {
    const plugins: Record<string, TablePlugin<RequirementRow>> = {
      stickyColumns,
      paguRow: paguRowPlugin,
    };
    if (hasNonPaguGroups) {
      plugins.grouping = groupedPlugin;
    }
    return plugins;
  }, [hasNonPaguGroups, groupedPlugin, stickyColumns, paguRowPlugin]);

  const tableIdKey = hasNonPaguGroups ? groupedIdKey : (item: RequirementRow) => String(item.requirement_id);

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={finalTableData}
        idKey={tableIdKey}
        plugins={tablePlugins}
        emptyState={<EmptyState isCompact title="Belum ada rencana kebutuhan (BOQ)" />}
      />
      <AlertDialog
        isOpen={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        onAction={handleDeleteConfirm}
        title="Hapus Kebutuhan"
        description="Hapus item ini dari rencana kebutuhan? Tindakan ini tidak dapat dibatalkan."
        actionLabel="Hapus"
        cancelLabel="Batal"
        isActionLoading={isDeleting}
      />
      <RequirementItemDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        initialData={editingItem}
        initialGroupId={preselectedGroupId}
      />
    </>
  );
}
