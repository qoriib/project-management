import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import { VStack, HStack, Card, Heading, Text, Section, Table, Grid, GridSpan, IconButton } from "@astryxdesign/core";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { getDashboardBOMReport, type DashboardBOMReportItem } from "@/db/services";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { Eye } from "lucide-react";
import { DashboardItemLogDialog } from "@/components/dashboard/DashboardItemLogDialog";

function Dashboard() {
  const [report, setReport] = useState<DashboardBOMReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [logItem, setLogItem] = useState<{ itemId: number, itemPriceId: number, itemName: string } | null>(null);

  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  useEffect(() => {
    async function load() {
      if (!selectedProjectId) {
        setReport([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const rep = await getDashboardBOMReport(selectedProjectId);
        setReport(rep);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedProjectId]);

  const stages = Array.from(new Set(report.map(r => r.stage_name)));

  const totalBudget = report.reduce((sum, r) => sum + r.planned_budget, 0);
  const totalPO = report.reduce((sum, r) => sum + r.total_po_price, 0);

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Dashboard Laporan Kebutuhan & Realisasi"
          subtitle="Ringkasan pemenuhan Bill of Materials terhadap pemesanan (PO) dan penerimaan (Delivery)"
        />
        <ProjectRequired>
          <>
            <Grid gap={4} columns={{ minWidth: 250, max: 2 }}>
              <GridSpan columns={1}>
                <Card padding={4}>
                  <VStack gap={2}>
                    <Text size="sm" color="secondary">Total Rencana Anggaran (BOM)</Text>
                    <Heading level={2}>{loading ? "…" : formatRupiah(totalBudget)}</Heading>
                  </VStack>
                </Card>
              </GridSpan>
              <GridSpan columns={1}>
                <Card padding={4}>
                  <VStack gap={2}>
                    <Text size="sm" color="secondary">Total Nilai Terpesan (PO)</Text>
                    <Heading level={2}>{loading ? "…" : formatRupiah(totalPO)}</Heading>
                  </VStack>
                </Card>
              </GridSpan>
            </Grid>

            {stages.length === 0 && !loading && (
              <VStack align="center" padding={8}>
                <Text color="secondary">Belum ada Kebutuhan (BOM) untuk proyek ini.</Text>
              </VStack>
            )}

            {stages.map(stage => {
              const stageData = report.filter(r => r.stage_name === stage).map(r => ({
                ...r,
                unique_id: `${r.item_id}-${r.item_price_id}`
              }));

              return (
                <VStack key={stage} gap={3}>
                  <Heading level={4}>{stage}</Heading>
                  <Card padding={0}>
                    <Table
                      columns={[
                        { key: "item", header: "Material / Alat", width: proportional(1.5), renderCell: (r: any) => <Text weight="medium">{r.item_name}</Text> },
                        {
                          key: "planned", header: "BOM (Rencana)", width: pixel(180), renderCell: (r: any) => (
                            <VStack gap={1}>
                              <Text size="sm">{formatNumber(r.planned_volume, 2)} {r.unit}</Text>
                              <Text size="2xs" color="secondary">{formatRupiah(r.planned_budget)}</Text>
                            </VStack>
                          )
                        },
                        {
                          key: "ordered", header: "PO (Dipesan)", width: pixel(180), renderCell: (r: any) => {
                            const percent = r.planned_volume > 0 ? (r.total_ordered / r.planned_volume) * 100 : 0;
                            const isOver = percent > 100;
                            return (
                              <ProgressBar
                                label={`${formatNumber(r.total_ordered, 2)} ${r.unit}`}
                                value={r.total_ordered}
                                max={r.planned_volume || 1}
                                variant={isOver ? 'warning' : percent === 100 ? 'success' : 'accent'}
                                hasValueLabel
                              />
                            );
                          }
                        },
                        {
                          key: "delivered", header: "Delivery (Terkirim)", width: pixel(180), renderCell: (r: any) => {
                            const percent = r.total_ordered > 0 ? (r.total_delivered / r.total_ordered) * 100 : 0;
                            return (
                              <ProgressBar
                                label={`${formatNumber(r.total_delivered, 2)} ${r.unit}`}
                                value={r.total_delivered}
                                max={r.total_ordered || 1}
                                variant={percent === 100 ? 'success' : 'accent'}
                                hasValueLabel
                              />
                            );
                          }
                        },
                        {
                          key: "actions", header: "Aksi", width: pixel(80), align: "center", renderCell: (r: any) => (
                            <IconButton
                              icon={<Eye size={16} />}
                              variant="ghost"
                              onClick={() => setLogItem({ itemId: r.item_id, itemPriceId: r.item_price_id, itemName: r.item_name })}
                              title="Lihat Log"
                            />
                          )
                        }
                      ]}
                      data={stageData as any}
                      idKey="unique_id"
                    />
                  </Card>
                </VStack>
              );
            })}
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

export const Route = createFileRoute('/')({
  component: Dashboard,
});
