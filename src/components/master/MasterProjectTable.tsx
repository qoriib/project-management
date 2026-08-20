import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, HStack, IconButton, Table, Text } from "@astryxdesign/core";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { useAppStore } from "@/store/useAppStore";
import { handleFormError } from "@/utils/form";
import { type TableColumn, pixel, proportional, useTableRowIndex } from "@astryxdesign/core/Table";
import type { Project, ProjectWithRelations } from "@/db/repositories";

interface MasterProjectTableProps {
  onEdit: (project: Project) => void;
}

interface ProjectRow extends ProjectWithRelations, Record<string, unknown> {}

export function MasterProjectTable({ onEdit }: MasterProjectTableProps) {
  const showToast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { projects, deleteProject } = useMasterStore();
  const { selectedProjectId, setSelectedProjectId } = useAppStore();

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteProject(deleteTarget.id);
      if (selectedProjectId === deleteTarget.id) {
        setSelectedProjectId(null);
      }
      setDeleteTarget(null);
    } catch (error: any) {
      handleFormError(error, showToast);
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<ProjectRow>[] = [
    {
      header: "Nama Proyek",
      key: "project_name",
      width: proportional(2),
    },
    {
      header: "Nama Perusahaan",
      key: "company_name",
      width: proportional(1.5),
    },
    {
      align: "end",
      header: "Tahun",
      key: "fiscal_year",
      width: pixel(100),
      renderCell: (row: ProjectRow) => <Text type="code">{row.fiscal_year}</Text>,
    },
    {
      align: "end",
      header: "Aksi",
      key: "actions",
      width: pixel(300),
      renderCell: (row: ProjectRow) => {
        const isActive = row.project_id === selectedProjectId;
        return (
          <HStack gap={2} justify="end">
            <Button
              size="sm"
              variant={isActive ? "primary" : "secondary"}
              label={isActive ? "Aktif" : "Aktifkan"}
              onClick={() => setSelectedProjectId(isActive ? null : row.project_id)}
            />
            <IconButton
              size="sm"
              variant="secondary"
              label="Edit"
              icon={<Pencil size={16} />}
              onClick={() => onEdit(row)}
            />
            <IconButton
              size="sm"
              variant="destructive"
              label="Hapus"
              icon={<Trash2 size={16} />}
              onClick={() => setDeleteTarget({ id: row.project_id, label: row.project_name })}
              isDisabled={row.has_relation}
            />
          </HStack>
        );
      },
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: projects as ProjectRow[],
    getRowKey: (item) => item.project_id,
    label: "#",
  });

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={projects as ProjectRow[]}
        idKey="project_id"
        plugins={{ rowIndex: rowIndexPlugin }}
        emptyState={<TableEmptyState message="Belum ada project." />}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Master Data"
        message={`Hapus proyek "${deleteTarget?.label}"? Semua data RAB dan Order terkait akan ikut terhapus.`}
        isLoading={deleting}
      />
    </>
  );
}
