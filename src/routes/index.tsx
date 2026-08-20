import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Section, VStack } from "@astryxdesign/core";
import { type ISODateString } from "@astryxdesign/core/Calendar";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReportFilterForm } from "@/components/report/ReportFilterForm";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { useAppStore } from "@/store/useAppStore";
import { ReportItemLogDialog } from "@/components/report/ReportItemLogDialog";
import { ReportSummaryCards } from "@/components/report/ReportSummaryCards";
import { ReportBOMTable } from "@/components/report/ReportBOMTable";
import { type BOMReportItem, getBOMReport } from "@/db/services";

function DashboardPage() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const [report, setReport] = useState<BOMReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [logItem, setLogItem] = useState<{
    itemId: string;
    itemPriceId: string;
    itemName: string;
  } | null>(null);
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
        const rep = await getBOMReport(selectedProjectId, startDate, endDate);
        setReport(rep);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedProjectId, startDate, endDate]);

  const totalBudget = report.reduce((sum, r) => sum + r.planned_budget, 0);
  const totalPO = report.reduce((sum, r) => sum + r.total_po_price, 0);

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Laporan Kebutuhan & Realisasi"
          subtitle="Ringkasan pemenuhan kebutuhan terhadap pemesanan dan penerimaan"
          actions={
            <ReportFilterForm
              startDate={startDate}
              endDate={endDate}
              onFilterChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          }
        />
        <ProjectRequired>
          <ReportSummaryCards totalBudget={totalBudget} totalPO={totalPO} loading={loading} />
          <ReportBOMTable
            report={report}
            loading={loading}
            onLogClick={(id, priceId, name) => setLogItem({ itemId: id, itemName: name, itemPriceId: priceId })}
          />
        </ProjectRequired>
      </VStack>
      {logItem && selectedProjectId && (
        <ReportItemLogDialog
          isOpen={true}
          onClose={() => setLogItem(null)}
          projectId={selectedProjectId}
          itemId={logItem.itemId}
          itemPriceId={logItem.itemPriceId}
          itemName={logItem.itemName}
        />
      )}
    </Section>
  );
}

export const Route = createFileRoute("/")({
  component: DashboardPage,
});
