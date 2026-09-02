import { useState } from "react";
import { Badge, Button } from "@astryxdesign/core";
import { useToast } from "@astryxdesign/core/Toast";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { useMasterStore } from "@/store/useMasterStore";
import { useAppStore } from "@/store/useAppStore";
import { AppRole, getUserRole } from "@/configs/app.config";
import { handleFormError } from "@/utils/form";

export function RequirementApprovalActions() {
  const showToast = useToast();

  const projects = useMasterStore((s) => s.projects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const currentProject = projects.find((p) => p.project_id === selectedProjectId);
  const isApproved = currentProject?.requirements_is_approved === 1;
  const isManager = getUserRole() === AppRole.MANAGER;

  const [confirmType, setConfirmType] = useState<"approve" | "cancel" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { approveRequirements, cancelApproveRequirements } = useMasterStore();

  if (!selectedProjectId || !currentProject) return null;

  if (!isManager) {
    return (
      <Badge variant={isApproved ? "success" : "warning"} label={isApproved ? "Sudah Disetujui" : "Belum Disetujui"} />
    );
  }

  const handleConfirm = async () => {
    if (!confirmType) return;

    setIsLoading(true);
    try {
      if (confirmType === "approve") {
        await approveRequirements(selectedProjectId);
      } else {
        await cancelApproveRequirements(selectedProjectId);
      }
      setConfirmType(null);
    } catch (err: any) {
      handleFormError(err, showToast);
    } finally {
      setIsLoading(false);
    }
  };

  const isApprove = confirmType === "approve";

  return (
    <>
      <Button
        variant={isApproved ? "destructive" : "primary"}
        label={isApproved ? "Batalkan Persetujuan" : "Setujui Rancangan"}
        onClick={() => setConfirmType(isApproved ? "cancel" : "approve")}
      />
      <AlertDialog
        isOpen={Boolean(confirmType)}
        onOpenChange={(open) => !open && setConfirmType(null)}
        onAction={handleConfirm}
        title={isApprove ? "Setujui Rancangan" : "Batalkan Persetujuan"}
        description={
          isApprove
            ? "Setujui rancangan kebutuhan ini? Data akan dikunci dan tidak dapat diubah."
            : "Batalkan persetujuan rancangan ini? Data akan dapat diedit kembali."
        }
        actionLabel={isApprove ? "Setujui" : "Batalkan Persetujuan"}
        actionVariant={isApprove ? "primary" : "destructive"}
        cancelLabel="Batal"
        isActionLoading={isLoading}
      />
    </>
  );
}
