import { Card, Grid, GridSpan, Heading, Text, VStack } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";

interface DashboardSummaryCardsProps {
  totalBudget: number;
  totalPO: number;
  loading: boolean;
}

export function ReportSummaryCards({ totalBudget, totalPO, loading }: DashboardSummaryCardsProps) {
  return (
    <Grid gap={4} columns={{ max: 3, minWidth: 250 }}>
      <GridSpan columns={1}>
        <Card padding={4}>
          <VStack gap={2}>
            <Text size="sm" color="secondary">
              Nilai Rencana BOM (Rp)
            </Text>
            <Heading level={2}>{loading ? "…" : formatNumber(totalBudget)}</Heading>
          </VStack>
        </Card>
      </GridSpan>
      <GridSpan columns={1}>
        <Card padding={4}>
          <VStack gap={2}>
            <Text size="sm" color="secondary">
              Nilai Realisasi PO (Rp)
            </Text>
            <Heading level={2}>{loading ? "…" : formatNumber(totalPO)}</Heading>
          </VStack>
        </Card>
      </GridSpan>
    </Grid>
  );
}
