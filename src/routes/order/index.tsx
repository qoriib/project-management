import { useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { OrderTable } from "@/components/order/OrderTable";
import { useAppStore } from "@/store/useAppStore";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import { useToast } from "@astryxdesign/core/Toast";
import { generateNextCode } from "@/utils/formatters";
import { handleFormError } from "@/utils/form";
import { useOrderStore } from "@/store/useOrderStore";

function OrderListPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { orders, createEmptyOrder } = useOrderStore();

  const handleCreateNew = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const nextOrderCode = generateNextCode(
        orders.map((o) => o.order_code),
        "PO-",
      );
      const today = new Date().toISOString().split("T")[0];
      const newOrderId = await createEmptyOrder({
        project_id: selectedProjectId,
        order_code: nextOrderCode,
        order_date: today,
      });
      navigate({ to: `/order/${newOrderId}/edit` });
    } catch (error: unknown) {
      handleFormError(error, showToast);
    }
  }, [selectedProjectId, orders, createEmptyOrder, navigate, showToast]);

  function openEdit(id: string) {
    navigate({ to: `/order/${id}/edit` });
  }

  useKeyboardShortcut({
    key: "n",
    ctrl: true,
    handler: handleCreateNew,
    enabled: Boolean(selectedProjectId),
  });

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Daftar Pengadaan (PO)</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Kelola dan pantau seluruh pengadaan pembelian
              </Text>
            </VStack>
            {selectedProjectId ? <Button variant="primary" label="Buat Baru" onClick={handleCreateNew} /> : null}
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
