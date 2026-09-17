import { useState } from "react";
import { Button, Dialog, HStack, Heading, SelectableCard, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { useToast } from "@astryxdesign/core/Toast";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { useMasterStore } from "@/store/useMasterStore";
import { getTimestampString, sanitizeFilename } from "@/utils/formatters";
import { generateReportPdf } from "@/db/services/pdf";
import { generateReportExcel } from "@/db/services/excel";
import type { ISODateString } from "@astryxdesign/core/Calendar";

type ReportFormat = "pdf" | "excel";

interface ReportDownloadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  startDate?: ISODateString;
  endDate?: ISODateString;
}

const FORMAT_CONFIG: Record<
  ReportFormat,
  {
    extension: string;
    filterName: string;
    dialogTitle: string;
    successToast: string;
    generate: (projectId: string, startDate?: ISODateString, endDate?: ISODateString) => Promise<Uint8Array>;
  }
> = {
  pdf: {
    extension: "pdf",
    filterName: "PDF Document",
    dialogTitle: "Simpan Laporan PDF",
    successToast: "Laporan PDF berhasil diunduh!",
    generate: generateReportPdf,
  },
  excel: {
    extension: "xlsx",
    filterName: "Excel",
    dialogTitle: "Simpan Laporan Excel",
    successToast: "Laporan Excel berhasil diunduh!",
    generate: generateReportExcel,
  },
};

export function ReportDownloadDialog({ isOpen, onClose, projectId, startDate, endDate }: ReportDownloadDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>("pdf");
  const [isDownloading, setIsDownloading] = useState(false);
  const showToast = useToast();

  const handleDownload = async () => {
    if (!projectId) return;

    try {
      setIsDownloading(true);
      const timestamp = getTimestampString();
      const project = useMasterStore.getState().projects.find((project) => project.project_id === projectId);
      const projectName = sanitizeFilename(project?.project_name ?? "Proyek");
      const config = FORMAT_CONFIG[selectedFormat];

      const filePath = await save({
        filters: [{ name: config.filterName, extensions: [config.extension] }],
        defaultPath: `${timestamp}_${projectName}.${config.extension}`,
        title: config.dialogTitle,
      });

      if (filePath) {
        const buffer = await config.generate(projectId, startDate, endDate);
        await writeFile(filePath, buffer);
        showToast({ body: config.successToast, type: "info" });
        onClose();
      }
    } catch (error) {
      console.error("Download report failed:", error);
      showToast({ body: "Gagal mengunduh laporan.", type: "error" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isDownloading) {
          onClose();
        }
      }}
      width={460}
    >
      <Layout
        header={
          <LayoutHeader hasDivider>
            <Heading level={3}>Unduh Laporan</Heading>
          </LayoutHeader>
        }
        content={
          <LayoutContent padding={4}>
            <VStack gap={3}>
              <Text color="secondary" size="sm">
                Pilih format laporan yang ingin diunduh:
              </Text>

              <HStack gap={3} width="100%">
                <SelectableCard
                  label="Ringkas"
                  isSelected={selectedFormat === "pdf"}
                  onChange={() => setSelectedFormat("pdf")}
                  padding={3}
                  width="50%"
                >
                  <VStack gap={0.5}>
                    <Text weight="bold">Ringkas</Text>
                    <Text size="sm" color="secondary">
                      Laporan PDF
                    </Text>
                  </VStack>
                </SelectableCard>

                <SelectableCard
                  label="Lengkap"
                  isSelected={selectedFormat === "excel"}
                  onChange={() => setSelectedFormat("excel")}
                  padding={3}
                  width="50%"
                >
                  <VStack gap={0.5}>
                    <Text weight="bold">Lengkap</Text>
                    <Text size="sm" color="secondary">
                      Spreadsheet Excel
                    </Text>
                  </VStack>
                </SelectableCard>
              </HStack>
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <HStack gap={2} justify="end" width="100%">
              <Button variant="secondary" onClick={onClose} isDisabled={isDownloading} label="Batal" />
              <Button
                variant="primary"
                onClick={handleDownload}
                isDisabled={isDownloading || !projectId}
                isLoading={isDownloading}
                label={selectedFormat === "pdf" ? "Unduh PDF" : "Unduh Excel"}
              />
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
