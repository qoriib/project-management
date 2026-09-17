import { VStack, Text } from "@astryxdesign/core";
import type { ReactNode } from "react";

/**
 * ReportComparisonCell
 *
 * Menampilkan pasangan nilai PO (atas) vs BOQ (bawah) pada tabel laporan secara bersih dan rata kanan.
 *
 * Color philosophy SBR — status finansial:
 *   - "over"  → var(--color-error) (amber/warning) — PO > BOQ (overspend)
 *   - "under" → var(--color-success) (green/success) — PO < BOQ (hemat)
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
  bomValue?: ReactNode;
  /** Status finansial nilai PO terhadap BOQ — menentukan warna label */
  poStatus?: FinancialStatus;
}

export function ReportComparisonCell({ poValue, bomValue, poStatus }: ReportComparisonCellProps) {
  const poColor = poStatus ? FINANCIAL_COLOR[poStatus] : undefined;

  return (
    <VStack gap={0.5} align="end" width="100%">
      <Text type="code" weight="medium" style={poColor ? { color: poColor } : undefined}>
        {poValue}
      </Text>
      <Text type="code" size="sm" color="secondary">
        {bomValue ?? "-"}
      </Text>
    </VStack>
  );
}
