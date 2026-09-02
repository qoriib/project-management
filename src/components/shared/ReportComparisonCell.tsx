import { HStack, VStack } from "@astryxdesign/core";
import { Text } from "@astryxdesign/core";
import type { ReactNode } from "react";

/**
 * ReportComparisonCell
 *
 * Menampilkan pasangan nilai PO (atas) vs BOM (bawah) pada tabel laporan.
 *
 * Color philosophy SBR — status finansial:
 *   - "over"  → var(--color-error) (amber/warning) — PO > BOM (overspend)
 *   - "under" → var(--color-success) (green/success) — PO < BOM (hemat)
 *   - "normal"/ undefined → warna teks default (inherit)
 */

export type FinancialStatus = "over" | "under" | "normal";

const FINANCIAL_COLOR: Record<FinancialStatus, string | undefined> = {
  over: "var(--color-error)",
  under: "var(--color-success)",
  normal: undefined,
};

export interface ReportComparisonCellProps {
  poValue: ReactNode;
  bomValue: ReactNode;
  poLabel?: string;
  bomLabel?: string;
  /** Status finansial nilai PO terhadap BOM — menentukan warna label */
  poStatus?: FinancialStatus;
}

export function ReportComparisonCell({
  poValue,
  bomValue,
  poLabel = "PO:",
  bomLabel = "BOM:",
  poStatus,
}: ReportComparisonCellProps) {
  const poColor = poStatus ? FINANCIAL_COLOR[poStatus] : undefined;

  return (
    <VStack gap={0.5} align="end">
      <HStack gap={1} justify="end">
        <Text weight="medium">{poLabel}</Text>
        <Text type="code" style={poColor ? { color: poColor } : undefined}>
          {poValue}
        </Text>
      </HStack>
      <HStack gap={1} justify="end">
        <Text size="sm" color="secondary">
          {bomLabel}
        </Text>
        <Text type="code" size="sm" color="secondary">
          {bomValue}
        </Text>
      </HStack>
    </VStack>
  );
}
