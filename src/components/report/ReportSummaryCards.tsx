import { Card, Grid, GridSpan, Heading, Text } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";

interface ReportSummaryCardsProps {
  totalBudget: number;
  totalPO: number;
  loading: boolean;
}

export function ReportSummaryCards({ totalBudget, totalPO, loading }: ReportSummaryCardsProps) {
  const delta = totalPO - totalBudget;
  const isOver = delta > 0;
  const isUnder = delta < 0;

  return (
    <Grid gap={3} columns={{ max: 3, minWidth: 260 }}>
      <GridSpan columns={1}>
        <Card height="100%">
          <Text size="sm" color="secondary" weight="medium" type="label">
            Nilai Rencana (BOM)
          </Text>
          <Heading level={3}>{loading ? "…" : `Rp ${formatNumber(totalBudget)}`}</Heading>
        </Card>
      </GridSpan>
      <GridSpan columns={1}>
        <Card height="100%">
          <Text size="sm" color="secondary" weight="medium" type="label">
            Nilai Pesanan (PO)
          </Text>
          <Heading level={3}>{loading ? "…" : `Rp ${formatNumber(totalPO)}`}</Heading>
        </Card>
      </GridSpan>
      <GridSpan columns={1}>
        <Card height="100%">
          <Text size="sm" weight="medium" type="label">
            Nilai Selisih
          </Text>
          <Heading
            level={3}
            style={{
              color: isOver ? "var(--color-error)" : isUnder ? "var(--color-success)" : undefined,
            }}
          >
            {loading ? "…" : `${delta > 0 ? "+" : ""}Rp ${formatNumber(delta)}`}
          </Heading>
        </Card>
      </GridSpan>
    </Grid>
  );
}
