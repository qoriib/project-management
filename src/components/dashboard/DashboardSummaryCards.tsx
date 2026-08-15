import { Grid, GridSpan, Card, VStack, Text, Heading } from "@astryxdesign/core";
import { formatRupiah } from "@/utils/formatters";

interface DashboardSummaryCardsProps {
  totalBudget: number;
  totalPO: number;
  loading: boolean;
}

export function DashboardSummaryCards({ totalBudget, totalPO, loading }: DashboardSummaryCardsProps) {
  return (
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
  );
}
