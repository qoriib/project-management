import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import {
  Section, VStack, HStack, Button, Table, Card, Heading, Text, Grid
} from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { getProjectCostReport, type ProjectCostRow } from "@/db/queries/reports";
import { formatRupiah } from "@/utils/formatters";
import { exportToExcel, printToPDF } from "@/utils/export";

function CostReportPage() {
  const [report, setReport] = useState<ProjectCostRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await getProjectCostReport();
      setReport(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalPO = report.reduce((sum, r) => sum + r.total_po, 0);
  const totalTerkirim = report.reduce((sum, r) => sum + r.total_terkirim_biaya, 0);
  const totalUtang = report.reduce((sum, r) => sum + r.saldo_utang, 0);

  function handleExport() {
    const data = report.map((r) => ({
      "Kode Proyek": r.project_code,
      "Nama Proyek": r.project_name,
      "Kontraktor": r.contractor_name,
      "Total Nilai PO (Rp)": r.total_po,
      "Fisik Terkirim Lapangan (Rp)": r.total_terkirim_biaya,
      "Total Tagihan Masuk (Rp)": r.total_invoice,
      "Total Terbayar (Rp)": r.total_bayar,
      "Saldo Utang (Rp)": r.saldo_utang,
    }));
    exportToExcel(data, `laporan-rekap-biaya-${new Date().toISOString().slice(0, 10)}`);
  }

  const columns = [
    { key: "project_code", label: "Kode", width: "100px" },
    { key: "project_name", label: "Nama Proyek / Paket Pekerjaan", width: "1.5fr" },
    { key: "contractor_name", label: "Kontraktor", width: "1.2fr" },
    { key: "total_po", label: "Nilai PO", width: "1fr", render: (v: number) => formatRupiah(v) },
    { key: "total_terkirim_biaya", label: "Realisasi Lapangan", width: "1fr", render: (v: number) => formatRupiah(v) },
    { key: "total_invoice", label: "Tagihan Masuk", width: "1fr", render: (v: number) => formatRupiah(v) },
    { key: "total_bayar", label: "Terbayar", width: "1fr", render: (v: number) => formatRupiah(v) },
    {
      key: "saldo_utang", label: "Saldo Utang", width: "1fr",
      render: (v: number) => (
        <Text weight="semibold" style={{ color: v > 0 ? "var(--color-negative-600)" : "var(--color-text-primary)" }}>
          {formatRupiah(v)}
        </Text>
      )
    },
  ];

  return (
    <Section padding={6}>
      <VStack gap={6}>
        <PageHeader
          title="Laporan Rekapitulasi Biaya Proyek"
          subtitle="Konsolidasi realisasi fisik, tagihan, dan sisa utang seluruh paket pekerjaan"
          actions={
            <HStack gap={2}>
              <Button variant="secondary" label="🖨️ Cetak PDF" onClick={printToPDF} />
              <Button variant="primary" label="📊 Export Excel" onClick={handleExport} />
            </HStack>
          }
        />

        {/* Global Summary */}
        <Grid gap={4} columns={{ minWidth: 200, repeat: "fit" }}>
          <Card padding={4}>
            <VStack gap={1}>
              <Text size="2xs" color="secondary">Total Nilai Kontrak PO</Text>
              <Heading level={3}>{loading ? "…" : formatRupiah(totalPO)}</Heading>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={1}>
              <Text size="2xs" color="secondary">Realisasi Fisik Lapangan</Text>
              <Heading level={3} style={{ color: "var(--color-accent-500)" }}>
                {loading ? "…" : formatRupiah(totalTerkirim)}
              </Heading>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={1}>
              <Text size="2xs" color="secondary">Total Sisa Utang</Text>
              <Heading level={3} style={{ color: "var(--color-negative-600)" }}>
                {loading ? "…" : formatRupiah(totalUtang)}
              </Heading>
            </VStack>
          </Card>
        </Grid>

        {/* Table Report */}
        <Card padding={4}>
          <VStack gap={3}>
            <Heading level={3}>Rincian Laporan Biaya per Proyek</Heading>
            <Table
              columns={columns as any}
              data={report as any}
              idKey="project_id"
              emptyState={
                <VStack align="center" padding={6}>
                  <Text color="secondary">Tidak ada data proyek untuk dilaporkan.</Text>
                </VStack>
              }
            />
          </VStack>
        </Card>
      </VStack>
    </Section>
  );
}


export const Route = createFileRoute('/reports/cost')({
  component: CostReportPage,
});
