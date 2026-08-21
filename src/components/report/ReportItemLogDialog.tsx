import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { HStack, Layout, LayoutContent, LayoutFooter, VStack } from "@astryxdesign/core/Layout";
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
  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={850} maxHeight="85vh">
      <Layout
        header={<DialogHeader title={item.item_name} onOpenChange={() => onClose()} />}
        content={
          <LayoutContent>
            <VStack gap={4}>
              <RequirementVariantCard item={item} />
              <OrderVariantCard item={item} />
              <TransactionHistoryCard projectId={projectId} item={item} isOpen={isOpen} />
            </VStack>
          </LayoutContent>
        }
      />
    </Dialog>
  );
}
