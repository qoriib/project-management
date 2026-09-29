import { Button, Dialog, DialogHeader, HStack, Token, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { ReportVariantCard } from "./dialog/ReportVariantCard";
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
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={850} maxHeight="85vh" purpose="form">
      <Layout
        header={
          <DialogHeader
            hasDivider
            title={item.item_name}
            endContent={item.group_name ? <Token label={item.group_name} /> : undefined}
            onOpenChange={(open) => !open && onClose()}
          />
        }
        content={
          <LayoutContent padding={4}>
            <VStack gap={4}>
              <ReportVariantCard type="planned" item={item} />
              <ReportVariantCard type="order" item={item} />
              <ReportVariantCard type="receipt" item={item} />
              <TransactionHistoryCard projectId={projectId} item={item} isOpen={isOpen} />
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <HStack justify="end" gap={2} width="100%">
              <Button variant="secondary" label="Tutup" onClick={onClose} />
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
