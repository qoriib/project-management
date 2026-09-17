import { Card, Divider, HStack, Text, VStack } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";
import { calcPriceSummary, TAX_RATIO_PERCENT } from "@/utils/calc";

interface ItemPriceSummaryCardProps {
  price?: number | null;
  qty?: number | string | null;
  hasTax?: boolean | null;
}

/**
 * Komponen kartu ringkasan kalkulasi harga item (Subtotal, PPn, Total) secara real-time.
 * Digunakan secara reusable pada dialog formulir item kebutuhan dan pesanan.
 */
export function ItemPriceSummaryCard({ price, qty, hasTax }: ItemPriceSummaryCardProps) {
  const { dpp, tax, total } = calcPriceSummary(price, qty, hasTax);

  return (
    <Card padding={3}>
      <VStack gap={1.5}>
        <HStack justify="between">
          <Text size="sm" color="secondary">
            Subtotal
          </Text>
          <Text type="code">Rp {formatNumber(dpp, "currency")}</Text>
        </HStack>
        <HStack justify="between">
          <Text size="sm" color="secondary">
            PPn ({TAX_RATIO_PERCENT}%):
          </Text>
          <Text type="code">{hasTax ? `Rp ${formatNumber(tax, "currency")}` : "-"}</Text>
        </HStack>
        <Divider />
        <HStack justify="between">
          <Text weight="bold">Total</Text>
          <Text type="code" weight="bold" color="primary">
            Rp {formatNumber(total, "currency")}
          </Text>
        </HStack>
      </VStack>
    </Card>
  );
}
