import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, VStack, HStack, Button, Text, Table, Badge, IconButton } from "@astryxdesign/core";
import { TextInput } from "@astryxdesign/core";
import { useToast } from "@astryxdesign/core/Toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { proportional } from "@astryxdesign/core/Table";
import { projectRepo, type StageRelation, type Project } from "@/db/repositories";

interface MasterProjectStageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export function MasterProjectStageDialog({ isOpen, onClose, project }: MasterProjectStageDialogProps) {
  const showToast = useToast();

  const [stages, setStages] = useState<StageRelation[]>([]);
  const [loading, setLoading] = useState(false);

  const [stageInput, setStageInput] = useState("");
  const [editTarget, setEditTarget] = useState<StageRelation | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<StageRelation | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadStages() {
    if (!project) return;

    setLoading(true);

    try {
      const data = await projectRepo.getStagesWithRelation(project.project_id);
      setStages(data);
    } catch {
      setStages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && project) {
      setStageInput("");
      setEditTarget(null);
      loadStages();
    }
  }, [isOpen, project]);

  function startEdit(stage: StageRelation) {
    setEditTarget(stage);
    setStageInput(stage.stage_name);
  }

  function cancelEdit() {
    setEditTarget(null);
    setStageInput("");
  }

  async function handleSave() {
    if (!project) return;

    const name = stageInput.trim();

    if (!name) return;

    setSaving(true);
    try {
      if (editTarget) {
        // Update existing stage name
        await projectRepo.saveStages(project.project_id, [
          ...stages.map(s =>
            s.stage_id === editTarget.stage_id
              ? { stage_id: s.stage_id, stage_name: name }
              : { stage_id: s.stage_id, stage_name: s.stage_name }
          )
        ]);
        showToast({ body: "Tahap berhasil diubah.", type: "info" });
      } else {
        // Add new stage
        await projectRepo.saveStages(project.project_id, [
          ...stages.map(s => ({ stage_id: s.stage_id, stage_name: s.stage_name })),
          { stage_name: name }
        ]);
        showToast({ body: "Tahap berhasil ditambahkan.", type: "info" });
      }
      setStageInput("");
      setEditTarget(null);
      await loadStages();
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menyimpan tahap.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !project) return;
    setDeleting(true);
    try {
      // Remove the target stage, keep all others
      await projectRepo.saveStages(
        project.project_id,
        stages
          .filter(s => s.stage_id !== deleteTarget.stage_id)
          .map(s => ({ stage_id: s.stage_id, stage_name: s.stage_name }))
      );
      showToast({ body: "Tahap berhasil dihapus.", type: "info" });
      setDeleteTarget(null);
      await loadStages();
    } catch (err: any) {
      showToast({ body: err.message || "Gagal menghapus tahap.", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: "stage_id",
      header: "#",
      width: proportional(0.5),
      renderCell: (row: StageRelation) => (
        <Text size="sm" color="secondary">{String(row.stage_id).padStart(3, "0")}</Text>
      ),
    },
    {
      key: "stage_name",
      header: "Nama Tahap",
      width: proportional(1),
      renderCell: (row: StageRelation) => (
        <HStack gap={2} align="center">
          <Text size="sm">{row.stage_name}</Text>
          {row.has_relation && <Badge variant="neutral" label="Aktif" />}
        </HStack>
      ),
    },
    {
      key: "actions",
      header: "",
      width: proportional(1.5),
      renderCell: (row: StageRelation) => {
        const locked = row.has_relation;
        return (
          <HStack gap={1}>
            <IconButton size="sm"
              variant="secondary"
              icon={<Pencil size={16} />} label="Edit"
              onClick={() => startEdit(row)}
              isDisabled={locked}
            />
            <IconButton size="sm"
              variant="destructive"
              icon={<Trash2 size={16} />} label="Hapus"
              onClick={() => setDeleteTarget(row)}
              isDisabled={locked}
            />
          </HStack>
        );
      },
    },
  ];

  return (
    <>
      <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={520}>
        <VStack gap={4}>
          {/* Inline form for add / edit */}
          <VStack gap={2}>
            <HStack gap={3} align="end">
              <div style={{ flex: 1 }}>
                <TextInput
                  label="Nama Tahap"
                  placeholder="Contoh: Perencanaan"
                  value={stageInput}
                  onChange={(v) => setStageInput(v)}
                  isRequired
                />
              </div>
              <HStack gap={2}>
                <Button
                  variant="primary"
                  label={editTarget ? "Simpan" : "Tambah"}
                  onClick={handleSave}
                  isLoading={saving}
                  isDisabled={!stageInput.trim()}
                />
                {editTarget && (
                  <Button variant="secondary" label="Batal" onClick={cancelEdit} />
                )}
              </HStack>
            </HStack>
          </VStack>

          {/* Stage list table */}
          {loading ? (
            <Text size="sm" color="secondary">Memuat data tahap...</Text>
          ) : stages.length > 0 ? (
            <Table
              columns={columns as any}
              data={stages as any}
              idKey="stage_id"
              textOverflow="truncate"
            />
          ) : (
            <VStack align="center" padding={4}>
              <Text color="secondary" size="sm">Belum ada tahap. Tambahkan di atas.</Text>
            </VStack>
          )}

          <HStack justify="end">
            <Button variant="secondary" label="Tutup" onClick={onClose} />
          </HStack>
        </VStack>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Tahap"
        message={`Hapus tahap "${deleteTarget?.stage_name}"? Tahap yang sudah memiliki BOM tidak bisa dihapus.`}
        isLoading={deleting}
      />
    </>
  );
}
