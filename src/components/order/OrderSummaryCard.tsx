import { Card, Grid, GridSpan, Heading, Text } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";
import { useOrderStore } from "@/store/useOrderStore";
import { calcGrandTotal } from "@/utils/calc";
import type { OrderWithSummary, OrderItemDetail } from "@/db/repositories";

interface OrderSummaryCardProps {
  order?: OrderWithSummary | null;
  items?: OrderItemDetail[];
}

export function OrderSummaryCard({ order: propOrder, items: propItems }: OrderSummaryCardProps = {}) {
  const store = useOrderStore();
  const order = propOrder !== undefined ? propOrder : store.currentOrder;
  const items = propItems !== undefined ? propItems : store.currentItems;

  if (!order) return null;

  const totalOrderPrice = order.total_price ?? calcGrandTotal(items);

  const totalOrderedQty = items.reduce((acc, item) => acc + (item.qty ?? 0), 0);
  const totalDeliveredQty = items.reduce((acc, item) => acc + (item.total_delivered ?? 0), 0);
  const completionPct = totalOrderedQty > 0 ? Math.min(100, (totalDeliveredQty / totalOrderedQty) * 100) : 0;
  const isComplete = totalOrderedQty > 0 && totalDeliveredQty >= totalOrderedQty;
  const isPartial = totalDeliveredQty > 0 && totalDeliveredQty < totalOrderedQty;

  return (
    <Grid gap={3} columns={{ max: 3, minWidth: 260 }}>
      <GridSpan columns={1}>
        <Card height="100%">
          <Text size="sm" color="secondary" weight="medium" type="label">
            Total Nilai Pesanan
          </Text>
          <Heading level={3}>Rp {formatNumber(totalOrderPrice)}</Heading>
        </Card>
      </GridSpan>
      <GridSpan columns={1}>
        <Card height="100%">
          <Text size="sm" color="secondary" weight="medium" type="label">
            Total Item & Volume
          </Text>
          <Heading level={3}>
            {items.length} Item ({formatNumber(totalOrderedQty)} Vol)
          </Heading>
        </Card>
      </GridSpan>
      <GridSpan columns={1}>
        <Card height="100%">
          <Text size="sm" color="secondary" weight="medium" type="label">
            Realisasi Penerimaan
          </Text>
          <Heading
            level={3}
            style={{
              color: isComplete ? "var(--color-success)" : isPartial ? "var(--color-blue)" : undefined,
            }}
          >
            {completionPct.toFixed(0)}% Selesai
          </Heading>
        </Card>
      </GridSpan>
    </Grid>
  );
}
