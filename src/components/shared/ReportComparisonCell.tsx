import { HStack, VStack } from "@astryxdesign/core";
import { Text } from "@astryxdesign/core";
import type { ReactNode } from "react";

/**
 * ReportComparisonCell
 *
 * Menampilkan pasangan nilai PO (atas) vs BOM (bawah) pada tabel laporan.
 *
 * Color philosophy SBR — status finansial BUKAN menggunakan brand crimson:
 *   - "over"  → amber/warning (.text-financial-over)  — PO > BOM (overspend)
 *   - "under" → green/success (.text-financial-under) — PO < BOM (hemat)
 *   - "normal"/ undefined → warna teks default (inherit)
 *
 * Styling dikontrol via CSS class dari app.css yang membaca token
 * --color-financial-over / --color-financial-under dari logoTheme.ts.
 * Tidak ada inline style atau hardcoded hex di sini.
 */

export type FinancialStatus = "over" | "under" | "normal";

const FINANCIAL_CLASS: Record<FinancialStatus, string> = {
  over: "text-financial-over",
  under: "text-financial-under",
  normal: "",
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
  const poClassName = poStatus ? FINANCIAL_CLASS[poStatus] : "";

  return (
    <VStack gap={0.5} align="end">
      <HStack gap={1} justify="end">
        <Text weight="medium">{poLabel}</Text>
        <Text type="code" className={poClassName}>
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
