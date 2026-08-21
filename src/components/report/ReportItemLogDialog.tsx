import { Badge, Dialog, HStack, Heading, IconButton, VStack } from "@astryxdesign/core";
import { formatItemCode } from "@/utils/formatters";
import { X } from "lucide-react";
import { EntityCode } from "@/components/shared/EntityCode";
import type { RequirementReportItem } from "@/db/services";
import { RequirementVariantCard } from "./dialog/RequirementVariantCard";
import { OrderVariantCard } from "./dialog/OrderVariantCard";
import { TransactionHistoryCard } from "./dialog/TransactionHistoryCard";

interface ReportItemLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  item: RequirementReportItem;
}

export function ReportItemLogDialog({ isOpen, onClose, projectId, item }: ReportItemLogDialogProps) {
  const itemCode = formatItemCode(item);

  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={850}>
      <VStack gap={4}>
        {/* Header */}
        <HStack align="center" justify="between">
          <VStack gap={0.5}>
            <HStack align="center" gap={2}>
              <Heading level={3}>{item.item_name}</Heading>
              {itemCode && <EntityCode id={itemCode} />}
            </HStack>
            <HStack align="center" gap={2}>
              <Badge variant="info" label={item.category || "LAINNYA"} />
              <Badge label={`Satuan: ${item.unit || "-"}`} />
              {item.is_unplanned && <Badge variant="red" label="Di Luar Rencana (Unplanned)" />}
            </HStack>
          </VStack>
          <IconButton
            icon={<X size={16} />}
            variant="secondary"
            type="button"
            label="Tutup"
            onClick={() => onClose()}
          />
        </HStack>

        {/* Card 1: Kebutuhan (BOM) */}
        <RequirementVariantCard item={item} />

        {/* Card 2: Pemesanan (PO) */}
        <OrderVariantCard item={item} />

        {/* Card 3: Riwayat Transaksi */}
        <TransactionHistoryCard projectId={projectId} item={item} isOpen={isOpen} />
      </VStack>
    </Dialog>
  );
}
