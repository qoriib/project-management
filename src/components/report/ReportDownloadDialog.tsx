import { useState } from "react";
import { Button, Dialog, HStack, Heading, SelectableCard, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { useToast } from "@astryxdesign/core/Toast";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { useMasterStore } from "@/store/useMasterStore";
import { getTimestampString, sanitizeFilename } from "@/utils/formatters";
import { generateFulfillmentVolumePdf } from "@/db/services/pdf";
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

export function ReportDownloadDialog({ isOpen, onClose, projectId, startDate, endDate }: ReportDownloadDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>("pdf");
  const [isDownloading, setIsDownloading] = useState(false);
  const showToast = useToast();

  const handleDownload = async () => {
    if (!projectId) return;

    try {
      setIsDownloading(true);
      const timestamp = getTimestampString();
      const project = useMasterStore.getState().projects.find((p) => p.project_id === projectId);
      const projectName = sanitizeFilename(project?.project_name ?? "Proyek");

      const baseFilename = `${timestamp}_${projectName}`;

      if (selectedFormat === "pdf") {
        const filename = `${baseFilename}.pdf`;
        const filePath = await save({
          filters: [{ name: "PDF Document", extensions: ["pdf"] }],
          defaultPath: filename,
          title: "Simpan Laporan PDF",
        });

        if (filePath) {
          const buffer = await generateFulfillmentVolumePdf(projectId, startDate, endDate);
          await writeFile(filePath, buffer);
          showToast({ body: "Laporan PDF berhasil diunduh!", type: "info" });
          onClose();
        }
      } else {
        const filename = `${baseFilename}.xlsx`;
        const filePath = await save({
          filters: [{ name: "Excel", extensions: ["xlsx"] }],
          defaultPath: filename,
          title: "Simpan Laporan Excel",
        });

        if (filePath) {
          const buffer = await generateReportExcel(projectId, startDate, endDate);
          await writeFile(filePath, buffer);
          showToast({ body: "Laporan Excel berhasil diunduh!", type: "info" });
          onClose();
        }
      }
    } catch (err) {
      console.error("Download report failed:", err);
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
