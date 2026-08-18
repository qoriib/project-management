import { Pencil, Trash2, Check, X } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { HStack, Table, Text, IconButton, Button, VStack, Divider } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn, useTableGroupedRows, type TablePlugin } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { EntityCode } from "@/components/shared/EntityCode";
import type { BOMDetail } from "@/db/repositories";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";
import { useBOMStore } from "@/store/useBOMStore";
import { useMasterStore } from "@/store/useMasterStore";
import { Plus } from "lucide-react";
import { useBOMForm } from "./form/useBOMForm";
import { ItemSelectorCell, QtyInputCell, PriceSelectorCell, TotalEstimasiCell } from "./BOMItemCells";

type BomRow = {
  [K in keyof BOMDetail]: BOMDetail[K];
} & {
  isFooter?: boolean;
  isDraft?: boolean;
  [key: string]: unknown;
};

interface BOMTableProps {
  refreshTrigger?: number;
}

export function BOMTable({ refreshTrigger }: BOMTableProps) {
  const { boms, deleteBOM, loadBOMs } = useBOMStore();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // State untuk form inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<BOMDetail | undefined>(undefined);
  const [editingGroupId, setEditingGroupId] = useState<string | undefined>(undefined);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useMasterStore((s) => s.projects);
  const currentProject = projects.find(p => p.project_id === selectedProjectId);
  const isApproved = currentProject?.bom_is_approved === 1;

  useEffect(() => {
    if (selectedProjectId) {
      loadBOMs(selectedProjectId);
    }
  }, [refreshTrigger, selectedProjectId]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBOM(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const { form, priceOptions, items, handleItemChange } = useBOMForm({
    initialData: editingData,
    defaultGroupId: editingGroupId || "",
    onSuccess: () => {
      setEditingId(null);
      setEditingData(undefined);
      setEditingGroupId(undefined);
    },
  });

  const baseColumns: TableColumn<BomRow>[] = [
    {
      key: "item_id",
      header: "No. Barang",
      width: pixel(120),
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;
        if (row.isDraft) return <Text color="secondary" size="sm">Baru</Text>;
        return <EntityCode prefix="BRG" id={row.item_id} />;
      }
    },
    {
      key: "item_name",
      header: "Nama Item",
      width: proportional(1),
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;
        if (row.bom_id === editingId) {
          return <ItemSelectorCell form={form} items={items} handleItemChange={handleItemChange} />;
        }
        return row.item_name;
      }
    },
    {
      key: "qty",
      header: "Volume Rencana",
      width: pixel(180),
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;
        if (row.bom_id === editingId) {
          return <QtyInputCell form={form} />;
        }
        return `${formatNumber(row.qty, 2)} ${row.unit || ""}`;
      }
    },
    {
      key: "price",
      header: "Harga Rencana (Rp)",
      width: pixel(200),
      align: "end",
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;
        if (row.bom_id === editingId) {
          return <PriceSelectorCell form={form} priceOptions={priceOptions} />;
        }
        return formatNumber(row.price);
      }
    },
    {
      key: "estimation",
      header: "Total Estimasi (Rp)",
      width: pixel(180),
      align: "end",
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;
        if (row.bom_id === editingId) {
          return <TotalEstimasiCell form={form} priceOptions={priceOptions} />;
        }
        return formatNumber(row.estimated_total || 0);
      }
    },
    {
      key: "actions",
      header: "Aksi",
      align: "end",
      width: pixel(100),
      renderCell: (row: BomRow) => {
        if (row.isFooter) return null;

        if (row.bom_id === editingId) {
          return (
            <HStack gap={2} justify="end">
              <form.Subscribe selector={(s) => s.canSubmit}>
                {(canSubmit) => (
                  <IconButton
                    size="sm"
                    variant="primary"
                    label="Simpan"
                    icon={<Check size={16} />}
                    isDisabled={!canSubmit}
                    onClick={() => {
                      form.handleSubmit();
                    }}
                  />
                )}
              </form.Subscribe>
              <IconButton
                size="sm"
                variant="secondary"
                label="Batal"
                icon={<X size={16} />}
                onClick={() => {
                  setEditingId(null);
                  setEditingData(undefined);
                  setEditingGroupId(undefined);
                  form.reset();
                }}
              />
            </HStack>
          );
        }

        return (
          <HStack gap={2} justify="end">
            {!isApproved && (
              <>
                <IconButton
                  size="sm"
                  variant="secondary"
                  label="Edit"
                  icon={<Pencil size={16} />}
                  isDisabled={!!editingId}
                  onClick={() => {
                    setEditingId(row.bom_id);
                    setEditingData(row as BOMDetail);
                    setEditingGroupId(row.bom_group_id);
                  }}
                />
                <IconButton
                  size="sm"
                  variant="destructive"
                  label="Hapus"
                  icon={<Trash2 size={16} />}
                  isDisabled={!!editingId}
                  onClick={() => setDeleteTarget(row.bom_id)}
                />
              </>
            )}
          </HStack>
        );
      },
    },
  ];

  const columns = isApproved ? baseColumns.slice(0, -1) : baseColumns;

  const { grandTotal, categorySubtotals } = useMemo(() => {
    let grand = 0;
    const subtotals: Record<string, number> = {};
    for (const b of boms) {
      const cat = b.bom_group_id || "LAINNYA";
      const total = b.estimated_total || 0;
      grand += total;
      subtotals[cat] = (subtotals[cat] || 0) + total;
    }
    return { grandTotal: grand, categorySubtotals: subtotals };
  }, [boms]);

  // Create a map to get group names from group ids
  const groupNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of boms) {
      if (b.bom_group_id) {
        map[b.bom_group_id] = b.bom_group_name || "Lainnya";
      }
    }
    return map;
  }, [boms]);

  const dataWithFooters = useMemo(() => {
    const list = [...boms] as BomRow[];
    const groupIds = new Set(boms.map(b => b.bom_group_id));
    for (const gid of groupIds) {
      if (gid) {
        if (editingId === `new-${gid}`) {
          list.push({ bom_id: `new-${gid}`, bom_group_id: gid, isDraft: true } as unknown as BomRow);
        }
        if (!isApproved) {
          list.push({ isFooter: true, bom_group_id: gid, bom_id: `footer-${gid}` } as unknown as BomRow);
        }
      }
    }
    return list;
  }, [boms, editingId, isApproved]);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { data: groupedData, plugin: groupedPlugin, idKey: groupedIdKey } = useTableGroupedRows<BomRow>({
    data: dataWithFooters,
    groupBy: (item) => item.bom_group_id || "LAINNYA",
    collapsedGroups,
    onToggleGroup: (key) => {
      if (!editingId) {
        setCollapsedGroups((prev) => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        });
      }
    },
    getRowKey: (item) => String(item.bom_id),
    renderGroupHeader: (key) => {
      const groupName = groupNameMap[key] || "Lainnya";
      return (
        <HStack justify="between" align="center" paddingInline={1} width="100%">
          <Text weight="bold">{groupName}</Text>
          <HStack paddingInline={2}>
            <Text weight="bold">{formatNumber(categorySubtotals[key] || 0)}</Text>
          </HStack>
        </HStack>
      );
    },
  });

  const footerPlugin = useMemo((): TablePlugin<BomRow> => ({
    transformBodyRow(props, item) {
      if ((item as any).isFooter) {
        const groupId = item.bom_group_id;

        // Hide Tambah Kebutuhan if we are already adding/editing something
        const hideButton = !!editingId;

        return {
          ...props,
          children: (
            <td colSpan={999} style={{ padding: "8px 16px", background: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border)" }}>
              {!hideButton && !isApproved && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={16} />}
                  label="Tambah Kebutuhan"
                  onClick={() => {
                    setEditingData(undefined);
                    setEditingGroupId(groupId);
                    setEditingId(`new-${groupId}`);
                    setCollapsedGroups(prev => {
                      const next = new Set(prev);
                      next.delete(groupId);
                      return next;
                    });
                  }}
                />
              )}
            </td>
          )
        };
      }

      // Give a slight highlighted background to the active editing row
      if (item.bom_id === editingId) {
        return {
          ...props,
          xstyle: [...props.xstyle, { background: "var(--color-bg-muted)" }]
        };
      }

      return props;
    }
  }), [editingId]);

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={groupedData}
        idKey={groupedIdKey}
        plugins={{ grouping: groupedPlugin, footer: footerPlugin }}
        emptyState={<TableEmptyState message="Belum ada rencana material di proyek ini. Harap siapkan Grup Pekerjaan terlebih dahulu di Master Proyek." />}
      />
      {boms.length > 0 && (
        <VStack>
          <Divider />
          <HStack justify="end" paddingBlock={3} gap={2}>
            <Text weight="bold" size="lg">Total:</Text>
            <Text weight="bold" size="lg" color="primary">
              {formatRupiah(grandTotal)}
            </Text>
          </HStack>
        </VStack>
      )}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kebutuhan"
        message="Apakah Anda yakin ingin menghapus material ini dari rencana (BOM)?"
        isLoading={deleting}
      />
    </>
  );
}
