import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import {
  VStack, HStack, Card, Heading, Text, Section, Table, StatusDot, Grid, GridSpan
} from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { getDashboardBOMReport, type DashboardBOMReportItem } from "@/db/queries/dashboard";
import { formatRupiah, formatNumber } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";
import { proportional, pixel } from "@astryxdesign/core/Table";

function Dashboard() {
  const [report, setReport] = useState<DashboardBOMReportItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      <VStack gap={6}>
        <PageHeader
          title="Dashboard Laporan Kebutuhan & Realisasi"
          subtitle="Ringkasan pemenuhan Bill of Materials terhadap pemesanan (PO) dan penerimaan (Delivery)"
        />

        {!selectedProjectId ? (
          <VStack align="center" padding={12}>
            <Text color="secondary">Silakan pilih Proyek Aktif di menu samping untuk melihat laporan.</Text>
          </VStack>
        ) : (
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
              <VStack align="center" padding={12}>
                <Text color="secondary">Belum ada Kebutuhan (BOM) untuk proyek ini.</Text>
              </VStack>
            )}

            {stages.map(stage => {
              const stageData = report.filter(r => r.stage_name === stage);
              return (
                <Card key={stage} padding={0}>
                  <VStack gap={0}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border-subtle)" }}>
                      <Heading level={4}>{stage}</Heading>
                    </div>
                    <Table
                      columns={[
                        { key: "item", header: "Material / Alat", width: proportional(1.5), renderCell: (r: DashboardBOMReportItem) => <Text weight="medium">{r.item_name}</Text> },
                        {
                          key: "planned", header: "BOM (Rencana)", width: pixel(180), renderCell: (r: DashboardBOMReportItem) => (
                            <VStack gap={0}>
                              <Text size="sm">{formatNumber(r.planned_volume, 2)} {r.unit}</Text>
                              <Text size="2xs" color="secondary">{formatRupiah(r.planned_budget)}</Text>
                            </VStack>
                          )
                        },
                        {
                          key: "ordered", header: "PO (Dipesan)", width: pixel(180), renderCell: (r: DashboardBOMReportItem) => {
                            const percent = r.planned_volume > 0 ? (r.total_ordered / r.planned_volume) * 100 : 0;
                            const isOver = percent > 100;
                            return (
                              <VStack gap={0}>
                                <HStack gap={2} align="center">
                                  <StatusDot variant={isOver ? "warning" : percent === 100 ? "success" : percent > 0 ? "info" : "neutral"} />
                                  <Text size="sm">{formatNumber(r.total_ordered, 2)} {r.unit}</Text>
                                </HStack>
                                <Text size="2xs" color="secondary">{percent.toFixed(1)}% Terpenuhi</Text>
                              </VStack>
                            );
                          }
                        },
                        {
                          key: "delivered", header: "Delivery (Terkirim)", width: pixel(180), renderCell: (r: DashboardBOMReportItem) => {
                            const percent = r.total_ordered > 0 ? (r.total_delivered / r.total_ordered) * 100 : 0;
                            return (
                              <VStack gap={0}>
                                <Text size="sm">{formatNumber(r.total_delivered, 2)} {r.unit}</Text>
                                <Text size="2xs" color="secondary">
                                  {r.total_ordered === 0 ? "Belum dipesan" : `${percent.toFixed(1)}% dari PO`}
                                </Text>
                              </VStack>
                            );
                          }
                        },
                      ]}
                      data={stageData}
                      idKey="item_name"
                    />
                  </VStack>
                </Card>
              );
            })}
          </>
        )}
      </VStack>
    </Section>
  );
}

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});
