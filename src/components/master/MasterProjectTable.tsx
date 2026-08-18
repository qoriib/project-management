import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Table, HStack, IconButton, Button, Text } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import { useAppStore } from "@/store/useAppStore";
import type { Project, ProjectWithRelations } from "@/db/repositories";

interface MasterProjectTableProps {
  onEdit: (project: Project) => void;
}

type ProjectRow = ProjectWithRelations & Record<string, unknown>;

export function MasterProjectTable({ onEdit }: MasterProjectTableProps) {
  const showToast = useToast();

  const { projects, deleteProject } = useMasterStore();
  const { selectedProjectId, setSelectedProjectId } = useAppStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteProject(deleteTarget.id);
      showToast({ body: "Project berhasil dihapus", type: "info" });
      setDeleteTarget(null);
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus project", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<ProjectRow>[] = [

    {
      key: "project_name",
      header: "Nama Proyek",
      width: proportional(2)
    },
    {
      key: "company_name",
      header: "Nama Perusahaan",
      width: proportional(1.5)
    },
    {
      key: "fiscal_year",
      header: "Tahun",
      width: pixel(100),
      align: "end",
      renderCell: (row: ProjectRow) => <Text type="code">{row.fiscal_year}</Text>
    },
    {
      key: "actions",
      header: "",
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
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Master Data"
        message={`Hapus proyek "${deleteTarget?.label}"? Semua data RAB dan PO terkait akan ikut terhapus.`}
        isLoading={deleting}
      />
    </>
  );
}
