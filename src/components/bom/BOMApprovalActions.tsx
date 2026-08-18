import { useState } from "react";
import { Button, Badge } from "@astryxdesign/core";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useMasterStore } from "@/store/useMasterStore";
import { useAppStore } from "@/store/useAppStore";

export function BOMApprovalActions() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useMasterStore((s) => s.projects);
  const currentProject = projects.find(p => p.project_id === selectedProjectId);
  const isApproved = currentProject?.bom_is_approved === 1;
  const envRole = import.meta.env.VITE_APP_ROLE?.toUpperCase() || 'MANAGER';
  const isManager = envRole === 'MANAGER';

  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { approveProjectBOM, cancelApproveProjectBOM } = useMasterStore();

  if (!selectedProjectId || !currentProject) return null;

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
  };

  const handleCancelApprove = async () => {
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
