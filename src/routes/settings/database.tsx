import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertDialog, Button, Divider, Heading, HStack, Text, useToast, VStack } from "@astryxdesign/core";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { SettingsExportDialog } from "@/components/settings/SettingsExportDialog";
import { Download, Upload } from "lucide-react";
import { getTimestampString, sanitizeFilename } from "@/utils/formatters";
import { handleFormError } from "@/utils/form";
import { resetDatabase } from "@/db/services";
import { resetAllStores, useMasterStore } from "@/store";

function SettingsDatabase() {
  const showToast = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [importSourcePath, setImportSourcePath] = useState<string | null>(null);

  const executeExport = async (projectId: string) => {
    try {
      setIsExporting(true);
      setIsExportDialogOpen(false);

      const timestamp = getTimestampString();
      const project = useMasterStore.getState().projects.find((p) => p.project_id === projectId);
      const projectName = project?.project_name ? sanitizeFilename(project.project_name) : "Project";
      const filename = `${timestamp}_ProjectBackup_${projectName}.proyek`;

      const targetPath = await save({
        defaultPath: filename,
        filters: [{ name: "Manajemen Proyek Archive", extensions: ["proyek"] }],
        title: "Simpan Backup Project",
      });

      if (targetPath) {
        await invoke("export_csv_zip", {
          projectId,
          targetPath,
        });
        showToast({ body: "Data berhasil diekspor!", type: "info" });
      }
    } catch (error: any) {
      handleFormError(error, showToast);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSelect = async () => {
    try {
      const sourcePath = await open({
        filters: [{ name: "Manajemen Proyek Archive", extensions: ["proyek"] }],
        multiple: false,
        title: "Pilih File Backup Project",
      });

      if (sourcePath && typeof sourcePath === "string") {
        setImportSourcePath(sourcePath);
        setIsImportConfirmOpen(true);
      }
    } catch (error: any) {
      handleFormError(error, showToast);
    }
  };

  const executeImport = async () => {
    if (!importSourcePath) return;

    try {
      setIsImportConfirmOpen(false);
      setIsImporting(true);
      await invoke("import_csv_zip", { sourcePath: importSourcePath });
      showToast({ body: "Data berhasil diimpor! Memuat ulang...", type: "info" });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      handleFormError(error, showToast);
    } finally {
      setIsImporting(false);
      setImportSourcePath(null);
    }
  };

  const executeReset = async () => {
    try {
      setIsResetting(true);
      setIsResetDialogOpen(false);
      await resetDatabase();
      resetAllStores();
      showToast({ body: "Basis data berhasil direset! Memuat ulang...", type: "info" });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      handleFormError(error, showToast);
    } finally {
      setIsResetting(false);
    }
  };

  const isLoading = isExporting || isImporting || isResetting;

  return (
    <>
      <VStack gap={4}>
        <HStack vAlign="center" gap={6}>
          <VStack width="100%" gap={1}>
            <Heading level={3}>Ekspor / Impor</Heading>
            <Text type="supporting" color="secondary">
              Ekspor data proyek Anda dan dapat dibagikan antar perangkat atau anggota tim untuk digabungkan secara
              otomatis.
            </Text>
          </VStack>
          <HStack gap={2}>
            <Button
              label="Export"
              variant="secondary"
              icon={<Download />}
              onClick={() => setIsExportDialogOpen(true)}
              isDisabled={isLoading}
            />
            <Button
              label="Import"
              variant="secondary"
              icon={<Upload />}
              onClick={handleImportSelect}
              isDisabled={isLoading}
            />
          </HStack>
        </HStack>
        <Divider />
        <HStack vAlign="center" gap={6}>
          <VStack width="100%" gap={1}>
            <Heading level={3}>Reset Database</Heading>
            <Text type="supporting" color="secondary">
              Hapus keseluruhan isi aplikasi dan kembali ke keadaan awal aplikasi diinstal. Tindakan ini tidak dapat
              dibatalkan.
            </Text>
          </VStack>
          <Button
            label="Hapus Semua Data"
            variant="destructive"
            onClick={() => setIsResetDialogOpen(true)}
            isDisabled={isLoading}
          />
        </HStack>
      </VStack>
      <AlertDialog
        title="Reset Database"
        description="Hapus seluruh basis data dan kembalikan ke setelan awal? Tindakan ini tidak dapat dibatalkan."
        actionLabel="Reset"
        actionVariant="destructive"
        cancelLabel="Batal"
        isOpen={isResetDialogOpen}
        onOpenChange={(open) => !open && setIsResetDialogOpen(false)}
        onAction={executeReset}
        isActionLoading={isResetting}
      />
      <SettingsExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onConfirm={executeExport}
        isLoading={isExporting}
      />
      <AlertDialog
        title="Impor Backup"
        description="Impor data cadangan ini? Data akan digabungkan dan aplikasi dimuat ulang."
        actionLabel="Impor"
        actionVariant="primary"
        cancelLabel="Batal"
        isOpen={isImportConfirmOpen}
        onOpenChange={(open) => !open && setIsImportConfirmOpen(false)}
        onAction={executeImport}
        isActionLoading={isImporting}
      />
    </>
  );
}

export const Route = createFileRoute("/settings/database")({
  component: SettingsDatabase,
});
