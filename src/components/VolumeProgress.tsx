import { VStack, HStack, Text, StatusDot } from "@astryxdesign/core";
import { formatNumber } from "@/utils/formatters";

interface VolumeProgressProps {
  label: string;
  satuan: string;
  qtyPO: number;
  totalTerkirim: number;
}

export function VolumeProgress({ label, satuan, qtyPO, totalTerkirim }: VolumeProgressProps) {
  const pct = qtyPO > 0 ? Math.min((totalTerkirim / qtyPO) * 100, 100) : 0;
  const sisa = Math.max(qtyPO - totalTerkirim, 0);

  const statusColor =
    pct >= 100 ? "success" : pct >= 85 ? "warning" : "neutral";

  return (
    <VStack gap={1}>
      <HStack gap={2} align="center">
        <StatusDot variant={statusColor} label={`${label} status`} />
        <Text size="sm" weight="medium">{label}</Text>
        <Text size="2xs" color="secondary" style={{ marginLeft: "auto" }}>
          {formatNumber(totalTerkirim, 2)} / {formatNumber(qtyPO, 2)} {satuan}
        </Text>
      </HStack>

      {/* Progress bar using CSS tokens */}
      <div
        style={{
          height: "6px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-neutral-200)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: "var(--radius-full)",
            background:
              pct >= 100
                ? "var(--color-positive-500)"
                : pct >= 85
                ? "var(--color-warning-500)"
                : "var(--color-accent-500)",
            transition: "width 0.4s ease",
          }}
        />
      </div>

      <HStack gap={4}>
        <Text size="2xs" color="secondary">Terkirim: {pct.toFixed(1)}%</Text>
        <Text size="2xs" color="secondary">Sisa: {formatNumber(sisa, 2)} {satuan}</Text>
      </HStack>
    </VStack>
  );
}
