import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import {
  Grid, GridSpan, VStack, HStack, Card, Heading, Text, Button, Section
} from "@astryxdesign/core";
import { PageHeader } from "@/components/PageHeader";
import { getPurchaseOrders } from "@/db/queries/po";
import { getDebtSummary } from "@/db/queries/billing";
import { formatRupiah, formatDate } from "@/utils/formatters";
import type { PurchaseOrder } from "@/db/queries/po";

function Dashboard() {
  const navigate = useNavigate();
  const [recentPOs, setRecentPOs] = useState<PurchaseOrder[]>([]);
  const [saldoUtang, setSaldoUtang] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pos, debt] = await Promise.all([
          getPurchaseOrders(),
          getDebtSummary()
        ]);
        setRecentPOs(pos.slice(0, 5));
        setSaldoUtang(debt.reduce((acc, curr) => acc + curr.saldo_utang, 0));
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

        <Grid gap={4} columns={{ minWidth: 300, max: 2 }}>
          <GridSpan columns={1}>
             <Card padding={4}>
               <VStack gap={2}>
                 <Text size="sm" color="secondary">Total Saldo Utang Vendor</Text>
                 <Heading level={2}>{loading ? "…" : formatRupiah(saldoUtang)}</Heading>
               </VStack>
             </Card>
          </GridSpan>

          <GridSpan columns={1}>
            <Card padding={4}>
              <VStack gap={4}>
                <HStack align="center" justify="between">
                  <Heading level={3}>PO Terbaru</Heading>
                  <Button size="sm" label="Lihat Semua" variant="ghost" onClick={() => navigate({ to: "/po" })} />
                </HStack>
                {recentPOs.length === 0 ? (
                  <Text color="secondary" size="sm">Belum ada PO.</Text>
                ) : (
                  <VStack gap={2}>
                    {recentPOs.map((po) => (
                      <HStack key={po.po_id} gap={3} align="center" style={{ cursor: "pointer" }} onClick={() => navigate({ to: `/po/${po.po_id}` })}>
                        <VStack gap={0}>
                          <Text size="sm" weight="medium">{po.po_number}</Text>
                          <Text size="2xs" color="secondary">{po.vendor_name} · {formatDate(po.po_date)}</Text>
                        </VStack>
                        <Text size="2xs" color="secondary" style={{ marginLeft: "auto" }}>
                          {formatRupiah(po.total_price || 0)}
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

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});
