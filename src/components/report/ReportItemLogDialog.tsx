import { Button, Dialog, HStack, Heading, VStack } from "@astryxdesign/core";
import { RequirementVariantCard } from "./dialog/RequirementVariantCard";
import { OrderVariantCard } from "./dialog/OrderVariantCard";
import { TransactionHistoryCard } from "./dialog/TransactionHistoryCard";
import type { RequirementReportItem } from "@/db/services";

interface ReportItemLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  item: RequirementReportItem;
}

export function ReportItemLogDialog({ isOpen, onClose, projectId, item }: ReportItemLogDialogProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={850} maxHeight="85vh">
      <VStack gap={4}>
        <Heading level={3}>{item.item_name}</Heading>
        <RequirementVariantCard item={item} />
        <OrderVariantCard item={item} />
        <TransactionHistoryCard projectId={projectId} item={item} isOpen={isOpen} />
        <HStack justify="end" gap={2} wrap="wrap">
          <Button variant="secondary" label="Tutup" onClick={onClose} />
        </HStack>
      </VStack>
    </Dialog>
  );
}
