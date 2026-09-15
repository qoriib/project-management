import { Button, Dialog, HStack, Heading, Text, Token, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatItemCode } from "@/utils/formatters";
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
  const formattedCode = formatItemCode(item);

  return (
    <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width={850} maxHeight="85vh">
      <Layout
        header={
          <LayoutHeader hasDivider padding={4}>
            <VStack gap={1} width="100%">
              <HStack justify="between" align="center" width="100%">
                <HStack gap={2} align="center">
                  <Heading level={3}>{item.item_name}</Heading>
                  {formattedCode ? <EntityCode id={formattedCode} size="sm" /> : null}
                </HStack>
                {item.group_name ? <Token label={item.group_name} /> : null}
              </HStack>
              <Text color="secondary" size="sm">
                Rincian perbandingan kebutuhan, pengadaan, dan riwayat transaksi untuk pekerjaan{" "}
                {item.group_name ? `"${item.group_name}"` : "ini"}
              </Text>
            </VStack>
          </LayoutHeader>
        }
        content={
          <LayoutContent padding={4}>
            <VStack gap={4}>
              <RequirementVariantCard item={item} />
              <OrderVariantCard item={item} />
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
