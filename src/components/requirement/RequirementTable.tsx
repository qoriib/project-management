import { useEffect, useMemo, useState } from "react";
import { EmptyState, HStack, Table, Text } from "@astryxdesign/core";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { RequirementItemDialog } from "@/components/requirement/RequirementItemDialog";
import { useAppStore } from "@/store/useAppStore";
import { useRequirementStore } from "@/store/useRequirementStore";
import { useRequirementGroupStore } from "@/store/useRequirementGroupStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useRequirementGroupedData } from "./table/useRequirementGroupedData";
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

  const { displayRequirements, groupOrder, sortedGroups, hasNonPaguGroups } = useRequirementGroupedData(
    requirements,
    groups,
  );

  const nonPaguItems = useMemo(() => displayRequirements.filter((r) => !r.is_pagu_account), [displayRequirements]);

  const paguItemMap = useMemo(() => {
    const map = new Map<string, RequirementRow>();
    for (const r of displayRequirements) {
      if (r.is_pagu_account && r.requirement_group_id) {
        map.set(r.requirement_group_id, r);
      }
    }
    return map;
  }, [displayRequirements]);

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

  const finalTableData = useMemo(() => {
    // Jika tidak ada kelompok non-pagu sama sekali (seperti proyek All Pagu)
    if (!hasNonPaguGroups) {
      return displayRequirements;
    }

    // Jika proyek mixed (campuran kelompok BOQ dan Pagu)
    const result: RequirementRow[] = [];
    const addedPaguIds = new Set<string>();

    for (const group of sortedGroups) {
      if (group.budget && group.budget > 0) {
        const paguRow = paguItemMap.get(group.requirement_group_id);
        if (paguRow && !addedPaguIds.has(paguRow.requirement_id)) {
          result.push(paguRow);
          addedPaguIds.add(paguRow.requirement_id);
        }
      } else {
        for (const r of groupedData) {
          const groupKey = (r as unknown as { groupKey?: string }).groupKey;
          if (groupKey === group.group_name || r.group_name === group.group_name) {
            result.push(r);
          }
        }
      }
    }

    // Tambahkan item ungrouped jika ada
    for (const r of groupedData) {
      const groupKey = (r as unknown as { groupKey?: string }).groupKey;
      if (!groupKey && !r.group_name && !result.includes(r)) {
        result.push(r);
      }
    }

    return result;
  }, [hasNonPaguGroups, displayRequirements, sortedGroups, paguItemMap, groupedData]);

  const stickyColumns = useTableStickyColumns<RequirementRow>({
    startKeys: ["item_code", "item_name"],
    endKeys: isApproved ? undefined : ["actions"],
  });

  const paguRowPlugin = useMemo<TablePlugin<RequirementRow>>(
    () => ({
      transformBodyRow: (props, item) => {
        if (item && item.is_pagu_account) {
          return {
            ...props,
            htmlProps: {
              ...props.htmlProps,
              style: {
                ...props.htmlProps?.style,
                backgroundColor: "var(--color-background-muted)",
                "--table-row-overlay": "var(--color-background-muted)",
                borderBottom: "1px solid var(--color-border)",
              },
            },
          };
        }
        return props;
      },
      transformBodyCell: (props, _column, item) => {
        if (item && item.is_pagu_account) {
          return {
            ...props,
            htmlProps: {
              ...props.htmlProps,
              style: {
                ...props.htmlProps?.style,
                backgroundColor: "var(--color-background-muted)",
                "--table-row-overlay": "var(--color-background-muted)",
                borderBottom: "1px solid var(--color-border)",
              },
            },
          };
        }
        return props;
      },
    }),
    [],
  );

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
