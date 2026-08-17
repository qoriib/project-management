import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Table, HStack, IconButton, Button } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { MasterProjectBOMGroupDialog } from "@/components/master/MasterProjectBOMGroupDialog";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import type { Project, ProjectWithRelations } from "@/db/repositories";

interface MasterProjectTableProps {
  onEdit: (project: Project) => void;
}

type ProjectRow = ProjectWithRelations & Record<string, unknown>;

export function MasterProjectTable({ onEdit }: MasterProjectTableProps) {
  const showToast = useToast();

  const { projects, deleteProject } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [groupProject, setGroupProject] = useState<ProjectWithRelations | null>(null);

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
      width: pixel(100)
    },
    {
      key: "actions",
      header: "",
      width: pixel(200),
      renderCell: (row: ProjectRow) => (
        <HStack gap={2} justify="end">
          <Button
            size="sm"
            variant="secondary"
            label="Grup"
            onClick={() => setGroupProject(row)}
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
      ),
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
      <MasterProjectBOMGroupDialog
        isOpen={!!groupProject}
        onClose={() => setGroupProject(null)}
        project={groupProject}
      />
    </>
  );
}
