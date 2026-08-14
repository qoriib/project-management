import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card, Table, HStack, IconButton, Button } from "@astryxdesign/core";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { MasterProjectStageDialog } from "@/components/master/MasterProjectStageDialog";
import { useToast } from "@astryxdesign/core/Toast";
import { useMasterStore } from "@/store/useMasterStore";
import type { Project, ProjectWithStages } from "@/db/repositories";

interface MasterProjectTableProps {
  onEdit: (project: Project) => void;
}

type ProjectRow = ProjectWithStages & Record<string, unknown>;

export function MasterProjectTable({ onEdit }: MasterProjectTableProps) {
  const showToast = useToast();

  const { projects, deleteProject } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stageProject, setStageProject] = useState<Project | null>(null);

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
      key: "project_id",
      header: "Kode",
      width: pixel(100),
      renderCell: (row: ProjectRow) => `PRJ-${String(row.project_id).padStart(4, '0')}`
    },
    {
      key: "project_name",
      header: "Nama Project",
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
            label="Tahap"
            onClick={() => setStageProject(row)}
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
      <Card>
        <Table
          textOverflow="truncate"
          columns={columns}
          data={projects as ProjectRow[]}
          idKey="project_id"
          emptyState={<TableEmptyState message="Belum ada project." />}
        />
      </Card>
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Master Data"
        message={`Hapus "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan jika sudah terikat transaksi.`}
        isLoading={deleting}
      />
      <MasterProjectStageDialog
        isOpen={!!stageProject}
        onClose={() => setStageProject(null)}
        project={stageProject}
      />
    </>
  );
}
