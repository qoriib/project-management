import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heading, HStack, IconButton, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { Download } from "lucide-react";
import { ReportFilterForm } from "@/components/report/ReportFilterForm";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { useAppStore } from "@/store/useAppStore";
import { ReportItemLogDialog } from "@/components/report/ReportItemLogDialog";
import { ReportDownloadDialog } from "@/components/report/ReportDownloadDialog";
import { ReportSummaryCards } from "@/components/report/ReportSummaryCards";
import { ReportSummaryTable } from "@/components/report/ReportSummaryTable";
import { type ISODateString } from "@astryxdesign/core/Calendar";
import { type RequirementReportItem, getRequirementReport } from "@/db/services";

function DashboardPage() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const [report, setReport] = useState<RequirementReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RequirementReportItem | null>(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<ISODateString | undefined>(undefined);
  const [endDate, setEndDate] = useState<ISODateString | undefined>(undefined);

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
        header={
          <LayoutHeader hasDivider padding={6}>
            <HStack gap={2} vAlign="center" hAlign="between">
              <VStack gap={0.5}>
                <Heading level={3}>Laporan Kebutuhan & Realisasi</Heading>
                <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                  Ringkasan realisasi pesanan dan penerimaan terhadap kebutuhan
                </Text>
              </VStack>
              {selectedProjectId ? (
                <HStack gap={4} vAlign="center">
                  <ReportFilterForm
                    startDate={startDate}
                    endDate={endDate}
                    onFilterChange={(start, end) => {
                      setStartDate(start);
                      setEndDate(end);
                    }}
                  />
                  <IconButton
                    label="Unduh Laporan"
                    variant="secondary"
                    icon={<Download />}
                    onClick={() => setDownloadDialogOpen(true)}
                  />
                </HStack>
              ) : null}
            </HStack>
          </LayoutHeader>
        }
        content={
          <LayoutContent padding={6}>
            <VStack gap={4}>
              <ProjectRequired>
                <ReportSummaryCards totalBudget={totalBudget} totalPO={totalPO} loading={loading} />
                <ReportSummaryTable report={report} loading={loading} onLogClick={(item) => setSelectedItem(item)} />
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
      {downloadDialogOpen && selectedProjectId && (
        <ReportDownloadDialog
          isOpen={true}
          onClose={() => setDownloadDialogOpen(false)}
          projectId={selectedProjectId}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </>
  );
}

export const Route = createFileRoute("/")({
  component: DashboardPage,
});
