import { useEffect, useState } from "react";
import { HStack, Button, Table, Text, VStack, Dialog } from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getProjectStages, deleteProjectStage, type ProjectStage } from "@/db/queries/bom";
import { useAppStore } from "@/store/useAppStore";
import { ProjectStageForm } from "./ProjectStageForm";

export function MasterTabStage() {
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState<ProjectStage | undefined>(undefined);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  async function load() {
    if (!selectedProjectId) {
      setStages([]);
      return;
    }
    const data = await getProjectStages(selectedProjectId);
    setStages(data);
  }

  useEffect(() => { load(); }, [selectedProjectId]);

  useEffect(() => {
    const handleOpenCreate = () => {
      setEditData(undefined);
      setIsDialogOpen(true);
    };
    window.addEventListener("openMasterCreate", handleOpenCreate);
    return () => window.removeEventListener("openMasterCreate", handleOpenCreate);
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProjectStage(deleteTarget);
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    { key: "stage_name", header: "Nama Tahap", width: proportional(1) },
    {
      key: "actions", header: "", width: pixel(140),
      renderCell: (row: ProjectStage) => (
        <HStack gap={1} justify="end">
          <Button size="sm" variant="ghost" label="Edit" onClick={() => { setEditData(row); setIsDialogOpen(true); }} />
          <Button size="sm" variant="destructive" label="Hapus" onClick={() => setDeleteTarget(row.stage_id)} />
        </HStack>
      ),
    },
  ];

  return (
    <VStack gap={4}>
      <Table
        columns={columns as any}
        data={stages as any}
        idKey="stage_id"
        hasHover
        emptyState={
          <VStack align="center" padding={8}>
            <Text color="secondary">
              {!selectedProjectId 
                ? "Pilih Proyek Aktif di menu samping terlebih dahulu."
                : "Belum ada tahap proyek. Klik 'Tambah Tahap' untuk memulai."}
            </Text>
          </VStack>
        }
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Tahap Proyek"
        message="Apakah Anda yakin ingin menghapus tahap ini? Data material yang terkait akan ikut terhapus."
        isLoading={deleting}
      />

      <Dialog isOpen={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)} width={500}>
        <ProjectStageForm 
          initialData={editData}
          onSuccess={() => { setIsDialogOpen(false); load(); }} 
          onCancel={() => setIsDialogOpen(false)} 
        />
      </Dialog>
    </VStack>
  );
}
