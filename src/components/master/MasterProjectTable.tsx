import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, HStack, IconButton, Table, Text } from "@astryxdesign/core";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { useAppStore } from "@/store/useAppStore";
import type { Project, ProjectWithRelations } from "@/db/repositories";

interface MasterProjectTableProps {
  onEdit: (project: Project) => void;
}

interface ProjectRow extends ProjectWithRelations, Record<string, unknown> {}

export function MasterProjectTable({ onEdit }: MasterProjectTableProps) {
  const showToast = useToast(),
    { projects, deleteProject } = useMasterStore(),
    { selectedProjectId, setSelectedProjectId } = useAppStore(),
    [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null),
    [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteProject(deleteTarget.id);
      showToast({ body: "Project berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (error: any) {
      showToast({ body: error.message || "Gagal menghapus project", type: "error" });
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
      renderCell: (row: ProjectRow) => <Text type="code">{row.fiscal_year}</Text>,
      width: pixel(100),
    },
    {
      header: "",
      key: "actions",
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
      width: pixel(300),
    },
  ];

  return (
    <>
      <Table
        hasHover
        textOverflow="truncate"
        columns={columns}
        data={projects as ProjectRow[]}
        idKey="project_id"
        emptyState={<TableEmptyState message="Belum ada project." />}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Master Data"
        message={`Hapus proyek "${deleteTarget?.label}"? Semua data RAB dan PO terkait akan ikut terhapus.`}
        isLoading={deleting}
      />
    </>
  );
}
