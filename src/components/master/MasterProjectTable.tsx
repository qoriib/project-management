import { useState } from "react";
import { Card, Button, Table, Badge, HStack, Text, VStack } from "@astryxdesign/core";
import { proportional } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MasterProjectStageDialog } from "@/components/master/MasterProjectStageDialog";
import { useToast } from "@astryxdesign/core/Toast";
import type { Project, ProjectWithStages } from "@/db/repositories";
import { useMasterStore } from "@/store/useMasterStore";

interface MasterProjectTableProps {
  onEdit: (project: Project) => void;
}

export function MasterProjectTable({ onEdit }: MasterProjectTableProps) {
  const { projects, deleteProject } = useMasterStore();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stageProject, setStageProject] = useState<Project | null>(null);
  const showToast = useToast();

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

  const columns = [
    {
      key: "project_id",
      header: "Kode",
      width: proportional(0.5),
      renderCell: (row: Project) => String(row.project_id).padStart(4, '0')
    },
    { key: "project_name", header: "Nama Project", width: proportional(1.3) },
    { key: "company_name", header: "Nama Perusahaan", width: proportional(1) },
    { key: "fiscal_year", header: "Tahun", width: proportional(0.5) },
    {
      key: "stages", header: "Tahapan", width: proportional(1.5),
      renderCell: (row: ProjectWithStages) => (
        <HStack gap={1} style={{ flexWrap: 'wrap' }}>
          {row.stages?.length > 0 ? row.stages.map((s, idx) => (
            <Badge key={idx} variant="neutral" label={s} />
          )) : "-"}
        </HStack>
      )
    },
    {
      key: "actions", header: "", width: proportional(1.5),
      renderCell: (row: Project) => (
        <HStack gap={1}>
          <Button size="sm" variant="ghost" label="Tahap" onClick={() => setStageProject(row)} />
          <Button size="sm" variant="ghost" label="Edit" onClick={() => onEdit(row)} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget({ id: row.project_id, label: row.project_name })} />
        </HStack>
      ),
    },
  ];

  return (
    <>
      <Card padding={0}>
        <Table
          textOverflow="truncate"
          columns={columns as any}
          data={projects as any}
          idKey="project_id"
          emptyState={<VStack align="center" padding={8}><Text color="secondary">Belum ada project.</Text></VStack>}
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
