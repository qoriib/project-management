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
  /** Nilai realisasi penerimaan (NP) - baris teratas */
  npValue?: ReactNode;
  /** Nilai pengadaan (PO) - baris tengah */
  poValue: ReactNode;
  /** Nilai perencanaan (BOQ) - baris terbawah */
  boqValue?: ReactNode;
  /** Alias kompatibilitas untuk boqValue */
  bomValue?: ReactNode;
  /** Status deviasi nilai NP terhadap PO — menentukan warna baris NP */
  npStatus?: FinancialStatus;
  /** Status deviasi nilai PO terhadap BOQ — menentukan warna baris PO */
  poStatus?: FinancialStatus;
}

export function ReportComparisonCell({
  npValue,
  poValue,
  boqValue,
  bomValue,
  npStatus,
  poStatus,
}: ReportComparisonCellProps) {
  const npColor = npStatus ? FINANCIAL_COLOR[npStatus] : undefined;
  const poColor = poStatus ? FINANCIAL_COLOR[poStatus] : undefined;
  const finalBoq = boqValue ?? bomValue ?? "-";

  return (
    <VStack gap={0.5} align="end" width="100%">
      {npValue !== undefined ? (
        <Text type="code" weight="medium" style={npColor ? { color: npColor } : undefined}>
          {npValue}
        </Text>
      ) : null}
      <Text type="code" weight="medium" style={poColor ? { color: poColor } : undefined}>
        {poValue}
      </Text>
      <Text type="code" size="sm" color="secondary">
        {finalBoq}
      </Text>
    </VStack>
  );
}
