import { Button, Dialog, HStack, Heading, Token, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
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
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={850} maxHeight="85vh">
      <Layout
        header={
          <LayoutHeader hasDivider padding={4}>
            <HStack justify="between" align="center" width="100%">
              <HStack gap={2} align="center">
                <Heading level={3}>{item.item_name}</Heading>
              </HStack>
              {item.group_name ? <Token label={item.group_name} /> : null}
            </HStack>
          </LayoutHeader>
        }
        content={
          <LayoutContent padding={4}>
            <VStack gap={4}>
              <ReportVariantCard type="planned" item={item} />
              <ReportVariantCard type="order" item={item} />
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
