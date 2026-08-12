import { useEffect, useState } from "react";
import {
  Section, VStack, Button, Table, Badge, Card, Heading, Text, Grid
} from "@astryxdesign/core";
import { PageHeader } from "../../components/PageHeader";
import { getDebtSummary, type DebtSummaryRow } from "../../db/queries/billing";
import { formatRupiah, VENDOR_TIPE_LABELS } from "../../utils/formatters";
import { exportToExcel } from "../../utils/export";

export default function DebtSummaryPage() {
  const [summary, setSummary] = useState<DebtSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await getDebtSummary();
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalTagihanAll = summary.reduce((sum, s) => sum + s.total_tagihan, 0);
  const totalBayarAll = summary.reduce((sum, s) => sum + s.total_bayar, 0);
  const totalUtangAll = summary.reduce((sum, s) => sum + s.saldo_utang, 0);

  function handleExport() {
    const data = summary.map((s) => ({
      "Nama Vendor": s.vendor_name,
      "Tipe": VENDOR_TIPE_LABELS[s.vendor_type] || s.vendor_type,
      "Jumlah Invoice": s.jumlah_invoice,
      "Total Tagihan": s.total_tagihan,
      "Total Dibayar": s.total_bayar,
      "Saldo Utang": s.saldo_utang,
    }));
    exportToExcel(data, `rekap-utang-vendor-${new Date().toISOString().slice(0, 10)}`);
  }

  const columns = [
    { key: "vendor_name", label: "Nama Pemasok / Vendor", width: "1.5fr" },
    {
      key: "vendor_type", label: "Kategori Pemasok", width: "150px",
      render: (v: string) => <Badge variant="neutral" label={VENDOR_TIPE_LABELS[v] ?? v} />
    },
    { key: "jumlah_invoice", label: "Jml Invoice", width: "100px", render: (v: number) => String(v) },
    { key: "total_tagihan", label: "Total Tagihan", width: "1fr", render: (v: number) => formatRupiah(v) },
    { key: "total_bayar", label: "Total Terbayar", width: "1fr", render: (v: number) => formatRupiah(v) },
    {
      key: "saldo_utang", label: "Saldo Utang Sisa", width: "1.2fr",
      render: (v: number) => (
        <Text weight="semibold" style={{ color: v > 0 ? "var(--color-negative-600)" : "var(--color-positive-600)" }}>
          {formatRupiah(v)}
        </Text>
      )
    },
  ];

  return (
    <Section padding={6}>
      <VStack gap={6}>
        <PageHeader
          title="Manajemen Utang & Ringkasan Tagihan"
          subtitle="Matriks rekapitulasi utang vendor internal vs eksternal"
          actions={<Button variant="secondary" label="📊 Export Excel" onClick={handleExport} />}
        />

        {/* Global Summary Metrics */}
        <Grid gap={4} columns={{ minWidth: 240, repeat: "fit" }}>
          <Card padding={4}>
            <VStack gap={1}>
              <Text size="2xs" color="secondary">Total Seluruh Tagihan</Text>
              <Heading level={3}>{loading ? "…" : formatRupiah(totalTagihanAll)}</Heading>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={1}>
              <Text size="2xs" color="secondary">Total Sudah Terbayar</Text>
              <Heading level={3} style={{ color: "var(--color-positive-600)" }}>
                {loading ? "…" : formatRupiah(totalBayarAll)}
              </Heading>
            </VStack>
          </Card>
          <Card padding={4}>
            <VStack gap={1}>
              <Text size="2xs" color="secondary">Sisa Saldo Utang Vendor</Text>
              <Heading level={3} style={{ color: "var(--color-negative-600)" }}>
                {loading ? "…" : formatRupiah(totalUtangAll)}
              </Heading>
            </VStack>
          </Card>
        </Grid>

        {/* Matrix Table */}
        <Card padding={4}>
          <VStack gap={3}>
            <Heading level={3}>Matriks Utang per Pemasok</Heading>
            <Table
              columns={columns as any}
              data={summary as any}
              idKey="vendor_id"
              emptyState={
                <VStack align="center" padding={6}>
                  <Text color="secondary">Belum ada tagihan terdaftar.</Text>
                </VStack>
              }
            />
          </VStack>
        </Card>
      </VStack>
    </Section>
  );
}
