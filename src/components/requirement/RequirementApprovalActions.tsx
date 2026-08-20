import { useState } from "react";
import { Badge, Button } from "@astryxdesign/core";
import { useToast } from "@astryxdesign/core/Toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useMasterStore } from "@/store/useMasterStore";
import { useAppStore } from "@/store/useAppStore";
import { AppRole, getUserRole } from "@/configs/app.config";
import { handleFormError } from "@/utils/form";

export function RequirementApprovalActions() {
  const showToast = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useMasterStore((s) => s.projects);
  const currentProject = projects.find((p) => p.project_id === selectedProjectId);
  const isApproved = currentProject?.requirements_is_approved === 1;
  const isManager = getUserRole() === AppRole.MANAGER;

  const [confirmType, setConfirmType] = useState<"approve" | "cancel" | null>(null);
  const [loading, setLoading] = useState(false);
  const { approveProjectBOM, cancelApproveProjectBOM } = useMasterStore();

  if (!selectedProjectId || !currentProject) {
    return null;
  }

  if (!isManager) {
    return (
      <Badge variant={isApproved ? "success" : "warning"} label={isApproved ? "Sudah Disetujui" : "Belum Disetujui"} />
    );
  }

  const handleConfirm = async () => {
    if (!confirmType) return;

    setLoading(true);
    try {
      if (confirmType === "approve") {
        await approveProjectBOM(selectedProjectId);
      } else {
        await cancelApproveProjectBOM(selectedProjectId);
      }
      setConfirmType(null);
    } catch (err: any) {
      handleFormError(err, showToast);
    } finally {
      setLoading(false);
    }
  };

  const isApprove = confirmType === "approve";

  return (
    <>
      {isApproved ? (
        <Button variant="destructive" label="Batalkan Persetujuan" onClick={() => setConfirmType("cancel")} />
      ) : (
        <Button variant="primary" label="Setujui Rancangan" onClick={() => setConfirmType("approve")} />
      )}
      <ConfirmDialog
        isOpen={Boolean(confirmType)}
        onClose={() => setConfirmType(null)}
        onConfirm={handleConfirm}
        title={isApprove ? "Setujui Rancangan" : "Batal Persetujuan"}
        message={
          isApprove
            ? "Apakah Anda yakin ingin menyetujui Requirement proyek ini? Setelah disetujui, semua data Requirement pada proyek ini akan dikunci dan tidak dapat diubah lagi."
            : "Apakah Anda yakin ingin membatalkan persetujuan Requirement ini? Data Requirement akan dapat diedit kembali."
        }
        confirmLabel={isApprove ? "Setuju" : "Batalkan Persetujuan"}
        isDestructive={!isApprove}
        isLoading={loading}
      />
    </>
  );
}
