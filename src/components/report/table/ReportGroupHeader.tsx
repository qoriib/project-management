import { Badge, HStack, Text } from "@astryxdesign/core";

interface ReportGroupHeaderProps {
  groupName: string;
  isPagu: boolean;
}

/**
 * Komponen header untuk kelompok pekerjaan pada tabel laporan pemenuhan.
 * Menampilkan badge "Pagu" jika kelompok pekerjaan memiliki pagu anggaran.
 */
export function ReportGroupHeader({ groupName, isPagu }: ReportGroupHeaderProps) {
  return (
    <HStack paddingInline={2} align="center" gap={2}>
      {isPagu && <Badge variant="warning" label="Pagu" />}
      <Text weight="bold">{groupName}</Text>
    </HStack>
  );
}
