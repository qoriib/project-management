import { useState } from "react";
import { Badge, Button } from "@astryxdesign/core";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useMasterStore } from "@/store/useMasterStore";
import { useAppStore } from "@/store/useAppStore";

export function BOMApprovalActions() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId),
    projects = useMasterStore((s) => s.projects),
    currentProject = projects.find((p) => p.project_id === selectedProjectId),
    isApproved = currentProject?.bom_is_approved === 1,
    envRole = import.meta.env.VITE_APP_ROLE?.toUpperCase() || "MANAGER",
    isManager = envRole === "MANAGER",
    [showApproveConfirm, setShowApproveConfirm] = useState(false),
    [showCancelConfirm, setShowCancelConfirm] = useState(false),
    [loading, setLoading] = useState(false),
    { approveProjectBOM, cancelApproveProjectBOM } = useMasterStore();

  if (!selectedProjectId || !currentProject) {
    return null;
  }

  if (!isManager) {
    return (
      <Badge
        variant={isApproved ? "success" : "warning"}
        label={isApproved ? "Sudah Disetujui" : "Belum Disetujui"}
      />
    );
  }

  const handleApprove = async () => {
      setLoading(true);
      try {
        await approveProjectBOM(selectedProjectId);
        setShowApproveConfirm(false);
      } finally {
        setLoading(false);
      }
    },
    handleCancelApprove = async () => {
      setLoading(true);
      try {
        await cancelApproveProjectBOM(selectedProjectId);
        setShowCancelConfirm(false);
      } finally {
        setLoading(false);
      }
    };

  return (
    <>
      {isApproved ? (
        <Button
          variant="secondary"
          label="Batalkan Persetujuan"
          onClick={() => setShowCancelConfirm(true)}
        />
      ) : (
        <Button
          variant="primary"
          label="Setujui Rancangan"
          onClick={() => setShowApproveConfirm(true)}
        />
      )}
      <ConfirmDialog
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApprove}
        title="Setujui Rancangan"
        message="Apakah Anda yakin ingin menyetujui BOM proyek ini? Setelah disetujui, semua data BOM pada proyek ini akan dikunci dan tidak dapat diubah lagi."
        confirmLabel="Setuju"
        isDestructive={false}
        isLoading={loading}
      />
      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelApprove}
        title="Batal Persetujuan"
        message="Apakah Anda yakin ingin membatalkan persetujuan BOM ini? Data BOM akan dapat diedit kembali."
        confirmLabel="Batalkan Persetujuan"
        isDestructive={true}
        isLoading={loading}
      />
    </>
  );
}
