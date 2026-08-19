import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Section, VStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { type BOMReportItem, getBOMReport } from "@/db/services";
import { useAppStore } from "@/store/useAppStore";
import { DashboardItemLogDialog } from "@/components/dashboard/DashboardItemLogDialog";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { DashboardBOMTable } from "@/components/dashboard/DashboardBOMTable";

function DashboardPage() {
  const [report, setReport] = useState<BOMReportItem[]>([]),
    [loading, setLoading] = useState(true),
    [logItem, setLogItem] = useState<{
      itemId: string;
      itemPriceId: string;
      itemName: string;
    } | null>(null),
    selectedProjectId = useAppStore((s) => s.selectedProjectId);

  useEffect(() => {
    async function load() {
      if (!selectedProjectId) {
        setReport([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const rep = await getBOMReport(selectedProjectId);
        setReport(rep);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedProjectId]);

  const totalBudget = report.reduce((sum, r) => sum + r.planned_budget, 0),
    totalPO = report.reduce((sum, r) => sum + r.total_po_price, 0);

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Laporan Kebutuhan & Realisasi"
          subtitle="Ringkasan pemenuhan kebutuhan terhadap pemesanan dan penerimaan"
        />
        <ProjectRequired>
          <>
            <DashboardSummaryCards totalBudget={totalBudget} totalPO={totalPO} loading={loading} />
            <DashboardBOMTable
              report={report}
              loading={loading}
              onLogClick={(itemId, itemPriceId, itemName) =>
                setLogItem({ itemId, itemName, itemPriceId })
              }
            />
          </>
        </ProjectRequired>
      </VStack>

      {logItem && selectedProjectId && (
        <DashboardItemLogDialog
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
