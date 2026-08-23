import { Badge, Card, Grid, GridSpan, HStack, Heading, Text, VStack } from "@astryxdesign/core";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { formatNumber } from "@/utils/formatters";

interface ReportSummaryCardsProps {
  totalBudget: number;
  totalPO: number;
  loading: boolean;
}

export function ReportSummaryCards({ totalBudget, totalPO, loading }: ReportSummaryCardsProps) {
  const delta = totalPO - totalBudget;
  const pct = totalBudget > 0 ? (totalPO / totalBudget) * 100 : 0;
  const isOver = delta > 0;
  const isUnder = delta < 0;
  const deltaLabel = loading ? "…" : delta === 0 ? "Sesuai" : isOver ? "Over budget" : "Under budget";

  return (
    <Grid gap={3} columns={{ max: 3, minWidth: 260 }}>
      <GridSpan columns={1}>
        <Card padding={3} height="100%">
          <VStack gap={2} height="100%">
            <HStack gap={1} align="center" justify="between">
              <HStack gap={1} align="center">
                <StatusDot variant="neutral" label="direncanakan" />
                <Text size="sm" color="secondary" weight="medium" type="label">
                  Direncanakan
                </Text>
              </HStack>
              <Badge variant="neutral" label="BOM" />
            </HStack>
            <Heading level={3} className="pm-tabular pm-kpi-value">
              {loading ? "…" : `Rp ${formatNumber(totalBudget)}`}
            </Heading>
            <Text size="sm" color="secondary">
              BOM disetujui
            </Text>
          </VStack>
        </Card>
      </GridSpan>
      <GridSpan columns={1}>
        <Card padding={3} height="100%">
          <VStack gap={2} height="100%">
            <HStack gap={1} align="center" justify="between">
              <HStack gap={1} align="center">
                <StatusDot variant="accent" label="dipesan" />
                <Text size="sm" color="secondary" weight="medium" type="label">
                  Dipesan
                </Text>
              </HStack>
              {!loading && totalBudget > 0 ? (
                <Badge variant={pct > 100 ? "red" : pct >= 100 ? "green" : "blue"} label={`${pct.toFixed(0)}%`} />
              ) : null}
            </HStack>
            <Heading level={3} className="pm-tabular pm-kpi-value">
              {loading ? "…" : `Rp ${formatNumber(totalPO)}`}
            </Heading>
            <Text size="sm" color="secondary">
              Realisasi PO
            </Text>
          </VStack>
        </Card>
      </GridSpan>
      <GridSpan columns={1}>
        <Card padding={3} height="100%" variant={isOver ? "red" : isUnder ? "green" : "default"}>
          <VStack gap={2} height="100%">
            <HStack gap={1} align="center" justify="between">
              <HStack gap={1} align="center">
                <StatusDot variant={isOver ? "error" : isUnder ? "success" : "neutral"} label="selisih" />
                <Text size="sm" weight="medium" type="label">
                  Selisih
                </Text>
              </HStack>
              {!loading ? <Badge variant={isOver ? "red" : isUnder ? "green" : "neutral"} label={deltaLabel} /> : null}
            </HStack>
            <Heading
              level={3}
              className={`pm-tabular pm-kpi-value${isOver ? " pm-error-text" : ""}`}
              color={isUnder ? "accent" : undefined}
            >
              {loading ? "…" : `${delta > 0 ? "+" : ""}Rp ${formatNumber(delta)}`}
            </Heading>
            <Text size="sm" color="secondary">
              {loading ? "Memuat" : isOver ? "PO melebihi BOM" : isUnder ? "PO di bawah BOM" : "PO sesuai rencana BOM"}
            </Text>
          </VStack>
        </Card>
      </GridSpan>
    </Grid>
  );
}
