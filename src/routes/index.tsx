import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heading, HStack, IconButton, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { Download } from "lucide-react";
import { ReportFilterForm } from "@/components/report/ReportFilterForm";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { useAppStore } from "@/store/useAppStore";
import { ReportItemLogDialog } from "@/components/report/ReportItemLogDialog";
import { ReportDownloadDialog } from "@/components/report/ReportDownloadDialog";
import { ReportSummaryTable } from "@/components/report/ReportSummaryTable";
import { type ISODateString } from "@astryxdesign/core/Calendar";
import { type RequirementReportItem, getRequirementReport } from "@/db/services";
import { formatNumber } from "@/utils/formatters";

function DashboardPage() {
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);

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

  // Hitung total BOQ: untuk kelompok yang memiliki pagu, gunakan nilai pagunya. Untuk kelompok tanpa pagu, gunakan akumulasi item BOQ.
  const groupBudgets = new Map<string, number>();
  let itemsBudgetNonPagu = 0;

  for (const item of report) {
    if (item.requirement_group_id && item.group_budget && item.group_budget > 0) {
      groupBudgets.set(item.requirement_group_id, item.group_budget);
    } else {
      itemsBudgetNonPagu += item.planned_budget;
    }
  }

  let totalPaguBudget = 0;
  for (const budget of groupBudgets.values()) {
    totalPaguBudget += budget;
  }

  const totalBudget = itemsBudgetNonPagu + totalPaguBudget;
  const totalPO = report.reduce((sum, item) => sum + item.total_order_price, 0);
  const totalVariance = totalBudget - totalPO;
  const isOverBudget = totalPO > totalBudget && totalBudget > 0;

  return (
    <>
      <Layout
        height="fill"
        header={
          <LayoutHeader hasDivider padding={6}>
            <HStack gap={2} vAlign="end" hAlign="between">
              <VStack gap={0.5}>
                <Heading level={3}>Laporan Pemenuhan</Heading>
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
                <ReportSummaryTable report={report} loading={loading} onLogClick={(item) => setSelectedItem(item)} />
              </ProjectRequired>
            </VStack>
          </LayoutContent>
        }
        footer={
          selectedProjectId ? (
            <LayoutFooter hasDivider padding={6}>
              <HStack gap={6} vAlign="end" hAlign="end">
                <HStack gap={2} vAlign="end">
                  <Text weight="medium" size="base" color="secondary">
                    Nilai BOQ:
                  </Text>
                  <Text type="code" weight="bold" size="lg">
                    Rp {formatNumber(totalBudget, "currency")}
                  </Text>
                </HStack>
                <HStack gap={2} vAlign="end">
                  <Text weight="medium" size="base" color="secondary">
                    Nilai PO:
                  </Text>
                  <Text
                    type="code"
                    weight="bold"
                    size="lg"
                    style={isOverBudget ? { color: "var(--color-error)" } : undefined}
                  >
                    Rp {formatNumber(totalPO, "currency")}
                  </Text>
                </HStack>
                <HStack gap={2} vAlign="end">
                  <Text weight="medium" size="base" color="secondary">
                    Deviasi:
                  </Text>
                  <Text
                    type="code"
                    weight="bold"
                    size="lg"
                    style={{ color: totalVariance < 0 ? "var(--color-error)" : "var(--color-success)" }}
                  >
                    Rp {formatNumber(totalVariance, "currency")}
                  </Text>
                </HStack>
              </HStack>
            </LayoutFooter>
          ) : null
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
