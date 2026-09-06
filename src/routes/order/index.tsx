import { useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { OrderTable } from "@/components/order/OrderTable";
import { useAppStore } from "@/store/useAppStore";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";

function OrderListPage() {
  const navigate = useNavigate();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const openNew = useCallback(() => {
    navigate({ to: "/order/new" });
  }, [navigate]);

  function openEdit(id: string) {
    navigate({ to: `/order/${id}/edit` });
  }

  useKeyboardShortcut({
    key: "n",
    ctrl: true,
    handler: openNew,
    enabled: Boolean(selectedProjectId),
  });

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Daftar Pemesanan (PO)</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Kelola dan pantau seluruh pemesanan pembelian
              </Text>
            </VStack>
            {selectedProjectId ? <Button variant="primary" label="Buat Baru" onClick={openNew} /> : null}
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <ProjectRequired>
              <OrderTable onEdit={openEdit} />
            </ProjectRequired>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/order/")({
  component: OrderListPage,
});
