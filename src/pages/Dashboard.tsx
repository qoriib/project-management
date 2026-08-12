import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid, GridSpan, VStack, HStack, Card, Heading, Text, Badge, Divider, Section, Button
} from "@astryxdesign/core";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { StatCard } from "../components/StatCard";
import { PageHeader } from "../components/PageHeader";
import { getDashboardStats, getCostByCategory, getPOVolumeAlerts } from "../db/queries/reports";
import { getPurchaseOrders } from "../db/queries/po";
import { formatRupiah, formatDate, KATEGORI_LABELS } from "../utils/formatters";
import type { PurchaseOrder } from "../db/queries/po";

interface Stats {
  total_po_aktif: number;
  total_biaya: number;
  saldo_utang: number;
  total_pengiriman: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<{ name: string; biaya: number }[]>([]);
  const [alerts, setAlerts] = useState<{ po_number: string; item_name: string; pct_terkirim: number; sisa: number; unit: string }[]>([]);
  const [recentPOs, setRecentPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, cats, als, pos] = await Promise.all([
          getDashboardStats(),
          getCostByCategory(),
          getPOVolumeAlerts(85),
          getPurchaseOrders(),
        ]);
        setStats(s);
        setChartData(
          cats.map((c) => ({
            name: KATEGORI_LABELS[c.category] ?? c.category,
            biaya: c.total_biaya,
          }))
        );
        setAlerts(als);
        setRecentPOs(pos.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Section padding={6}>
      <VStack gap={6}>
        <PageHeader
          title="Dashboard"
          subtitle="Ringkasan operasional proyek konstruksi"
        />

        {/* KPI Cards */}
        <Grid gap={4} columns={{ minWidth: 220, repeat: "fit" }}>
          <StatCard
            label="Total Biaya PO"
            value={loading ? "…" : formatRupiah(stats?.total_biaya)}
            sublabel="Seluruh dokumen pemesanan"
            icon="📋"
          />
          <StatCard
            label="Saldo Utang Vendor"
            value={loading ? "…" : formatRupiah(stats?.saldo_utang)}
            accent={(stats?.saldo_utang ?? 0) > 0 ? "negative" : "positive"}
            icon="💳"
          />
          <StatCard
            label="Total Pengiriman"
            value={loading ? "…" : String(stats?.total_pengiriman ?? 0)}
            sublabel="entri pengiriman"
            icon="🚚"
          />
        </Grid>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card padding={4}>
            <VStack gap={3}>
              <HStack gap={2} align="center">
                <Text weight="semibold">⚠️ Peringatan Sisa Kontrak Volume PO (&gt;85%)</Text>
                <Badge variant="negative">{alerts.length}</Badge>
              </HStack>
              <Divider />
              {alerts.map((a, i) => (
                <HStack key={i} gap={3} align="center">
                  <Badge variant={a.pct_terkirim >= 100 ? "positive" : "warning"}>
                    {a.pct_terkirim.toFixed(0)}%
                  </Badge>
                  <Text size="sm">
                    <strong>{a.po_number}</strong> — {a.item_name}
                  </Text>
                  <Text size="xs" color="secondary" style={{ marginLeft: "auto" }}>
                    Sisa: {a.sisa.toFixed(2)} {a.unit}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Card>
        )}

        {/* Charts + Recent PO */}
        <Grid gap={4} columns={{ minWidth: 300, max: 2 }}>
          <GridSpan columns={1}>
            <Card padding={4}>
              <VStack gap={4}>
                <Heading size="sm">Biaya per Kategori Material</Heading>
                {chartData.length === 0 ? (
                  <Text color="secondary" size="sm">Belum ada data pengiriman.</Text>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                      />
                      <YAxis
                        tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
                        tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
                      />
                      <Tooltip
                        formatter={(v: number) => [formatRupiah(v), "Biaya"]}
                        contentStyle={{
                          background: "var(--color-surface-overlay)",
                          border: "1px solid var(--color-border-subtle)",
                          borderRadius: "var(--radius-md)",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="biaya"
                        fill="var(--color-accent-500)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </VStack>
            </Card>
          </GridSpan>

          <GridSpan columns={1}>
            <Card padding={4}>
              <VStack gap={4}>
                <HStack align="center" justify="between">
                  <Heading size="sm">PO Terbaru</Heading>
                  <Button size="sm" variant="tertiary" onPress={() => navigate("/po")}>Lihat Semua</Button>
                </HStack>
                {recentPOs.length === 0 ? (
                  <Text color="secondary" size="sm">Belum ada PO.</Text>
                ) : (
                  <VStack gap={2}>
                    {recentPOs.map((po) => (
                      <HStack key={po.po_id} gap={3} align="center" style={{ cursor: "pointer" }} onPress={() => navigate(`/po/${po.po_id}`)}>
                        <VStack gap={0}>
                          <Text size="sm" weight="medium">{po.po_number}</Text>
                          <Text size="xs" color="secondary">{po.vendor_name} · {formatDate(po.po_date)}</Text>
                        </VStack>
                        <Text size="xs" color="secondary" style={{ marginLeft: "auto" }}>
                          {formatRupiah(po.total_price)}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Card>
          </GridSpan>
        </Grid>
      </VStack>
    </Section>
  );
}
