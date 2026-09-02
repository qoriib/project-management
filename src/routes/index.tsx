import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HStack, IconButton, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { Download } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReportFilterForm } from "@/components/report/ReportFilterForm";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { useAppStore } from "@/store/useAppStore";
import { ReportItemLogDialog } from "@/components/report/ReportItemLogDialog";
import { ReportSummaryCards } from "@/components/report/ReportSummaryCards";
import { ReportRequirementTable } from "@/components/report/ReportRequirementTable";
import { getTimestampString, sanitizeFilename } from "@/utils/formatters";
import { useToast } from "@astryxdesign/core/Toast";
import { type ISODateString } from "@astryxdesign/core/Calendar";
import { type RequirementReportItem, getRequirementReport, generateRequirementReportExcel } from "@/db/services";
import { useMasterStore } from "@/store/useMasterStore";

function DashboardPage() {
  const showToast = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const [report, setReport] = useState<RequirementReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RequirementReportItem | null>(null);
  const [startDate, setStartDate] = useState<ISODateString | undefined>(undefined);
  const [endDate, setEndDate] = useState<ISODateString | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!selectedProjectId) return;
    try {
      setExporting(true);
      const timestamp = getTimestampString();
      const project = useMasterStore.getState().projects.find((p) => p.project_id === selectedProjectId);
      const projectName = project?.project_name ? sanitizeFilename(project.project_name) : "Proyek";
      const filename = `${timestamp}_Laporan_${projectName}.xlsx`;

      const filePath = await save({
        filters: [{ name: "Excel", extensions: ["xlsx"] }],
        defaultPath: filename,
        title: "Simpan Laporan Excel",
      });

      if (filePath) {
        const buffer = await generateRequirementReportExcel(selectedProjectId, startDate, endDate);
        await writeFile(filePath, buffer);
        showToast({ body: "Laporan Excel berhasil diekspor!", type: "info" });
      }
    } catch (err) {
      console.error("Export failed", err);
      showToast({ body: "Gagal mengekspor laporan Excel.", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    async function load() {
      if (!selectedProjectId) {
        setReport([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const rep = await getRequirementReport(selectedProjectId, startDate, endDate);
        setReport(rep);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedProjectId, startDate, endDate]);

  const totalBudget = report.reduce((sum, r) => sum + r.planned_budget, 0);
  const totalPO = report.reduce((sum, r) => sum + r.total_order_price, 0);

  return (
    <>
      <Layout
        height="fill"
        content={
          <LayoutContent padding={6}>
            <VStack gap={4}>
              <PageHeader
                title="Laporan Kebutuhan & Realisasi"
                subtitle="Ringkasan realisasi pesanan dan penerimaan terhadap BOM"
                actions={
                  selectedProjectId ? (
                    <HStack gap={4} align="end">
                      <ReportFilterForm
                        startDate={startDate}
                        endDate={endDate}
                        onFilterChange={(start, end) => {
                          setStartDate(start);
                          setEndDate(end);
                        }}
                      />
                      <IconButton
                        variant="secondary"
                        label="Export Excel"
                        icon={<Download />}
                        onClick={handleExport}
                        isDisabled={exporting}
                      />
                    </HStack>
                  ) : undefined
                }
              />
              <ProjectRequired>
                <ReportSummaryCards totalBudget={totalBudget} totalPO={totalPO} loading={loading} />
                <ReportRequirementTable
                  report={report}
                  loading={loading}
                  onLogClick={(item) => setSelectedItem(item)}
                />
              </ProjectRequired>
            </VStack>
          </LayoutContent>
        }
      />
      {selectedItem && selectedProjectId && (
        <ReportItemLogDialog
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          projectId={selectedProjectId}
          item={selectedItem}
        />
      )}
    </>
  );
}

export const Route = createFileRoute("/")({
  component: DashboardPage,
});
