import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heading, HStack, IconButton, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { useToast } from "@astryxdesign/core/Toast";
import { Download } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { ReceiptTable } from "@/components/receipt/ReceiptTable";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { generateReceiptExcel } from "@/db/services/excel";
import { getTimestampString, sanitizeFilename } from "@/utils/formatters";

function ReceiptPage() {
  const showToast = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const projects = useMasterStore((state) => state.projects);
  const currentProject = projects.find((project) => project.project_id === selectedProjectId);

  const handleExportExcel = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      setIsExporting(true);
      const timestamp = getTimestampString();
      const projectName = sanitizeFilename(currentProject?.project_name ?? "Proyek");
      const filePath = await save({
        filters: [{ name: "Excel", extensions: ["xlsx"] }],
        defaultPath: `${timestamp}_NP_${projectName}.xlsx`,
        title: "Simpan Laporan NP Excel",
      });

      if (filePath) {
        const buffer = await generateReceiptExcel(selectedProjectId);
        await writeFile(filePath, buffer);
        showToast({ body: "Laporan NP Excel berhasil diunduh!", type: "info" });
      }
    } catch (error) {
      console.error("Export NP Excel failed:", error);
      showToast({ body: "Gagal mengunduh laporan NP.", type: "error" });
    } finally {
      setIsExporting(false);
    }
  }, [selectedProjectId, currentProject, showToast]);

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Daftar Penerimaan (NP)</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Kelola dan pantau riwayat penerimaan barang
              </Text>
            </VStack>
            {selectedProjectId ? (
              <IconButton
                variant="secondary"
                icon={<Download />}
                label="Export Excel"
                onClick={handleExportExcel}
                isLoading={isExporting}
              />
            ) : null}
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <ProjectRequired>
              <ReceiptTable />
            </ProjectRequired>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/receipt/")({
  component: ReceiptPage,
});
