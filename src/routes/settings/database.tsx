import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Divider, HStack, Text, VStack, Heading } from "@astryxdesign/core";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { SettingsResetDialog } from "@/components/settings/SettingsResetDialog";
import { SettingsExportDialog } from "@/components/settings/SettingsExportDialog";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Download, Upload } from "lucide-react";
import { useToast } from "@astryxdesign/core/Toast";
import { getTimestampString } from "@/utils/formatters";
import { handleFormError } from "@/utils/form";

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
      const filename = `${timestamp}_ProjectBackup_${projectId}.project`;

      const targetPath = await save({
        defaultPath: filename,
        filters: [{ name: "Project Data Archive", extensions: ["project"] }],
        title: "Simpan Backup Project",
      });

      if (targetPath) {
        await invoke("export_csv_zip", {
          projectId,
          targetPath,
        });
      }

      showToast({ body: "Data berhasil diekspor!", type: "info" });
    } catch (error: any) {
      handleFormError(error, showToast);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSelect = async () => {
    try {
      const sourcePath = await open({
        filters: [{ name: "Project Data Archive", extensions: ["project"] }],
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
      showToast({ body: "Data berhasil diimpor!", type: "info" });
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
      await invoke("reset_db");
      showToast({ body: "Data berhasil direset!", type: "info" });
    } catch (error: any) {
      handleFormError(error, showToast);
    } finally {
      setIsResetting(false);
    }
  };

  const isLoading = isExporting || isImporting || isResetting;

  return (
    <>
      <VStack gap={6}>
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
              icon={<Download size="1em" />}
              onClick={() => setIsExportDialogOpen(true)}
              isDisabled={isLoading}
            />
            <Button
              label="Import"
              variant="secondary"
              icon={<Upload size="1em" />}
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
      <SettingsResetDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={executeReset}
        isLoading={isResetting}
      />
      <SettingsExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onConfirm={executeExport}
        isLoading={isExporting}
      />
      <AlertDialog
        title="Impor Backup"
        description="PERINGATAN: Mengimpor data akan menggabungkan perubahan ke dalam basis data saat ini. Aplikasi akan memuat ulang setelah selesai. Apakah Anda ingin melanjutkan?"
        actionLabel="Ya, Impor"
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
