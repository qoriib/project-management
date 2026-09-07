import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Button, Card, Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Selector } from "@astryxdesign/core/Selector";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { LoadingState } from "@/components/shared/LoadingState";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { useAppStore } from "@/store/useAppStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useReceiptStore } from "@/store/useReceiptStore";
import { useToast } from "@astryxdesign/core/Toast";
import { generateNextCode } from "@/utils/formatters";
import { handleFormError } from "@/utils/form";

const searchSchema = z.object({
  order: z.string().optional(),
});

function NewReceiptPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { order: initialPoId } = Route.useSearch();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const { orders, loadAllOrders } = useOrderStore();
  const { loadAllReceipts, createEmptyReceipt } = useReceiptStore();

  const [isCreating, setIsCreating] = useState(false);
  const autoCreatedRef = useRef(false);

  useEffect(() => {
    if (!selectedProjectId) return;
    loadAllOrders(selectedProjectId);
    loadAllReceipts(selectedProjectId);
  }, [selectedProjectId, loadAllOrders, loadAllReceipts]);

  useEffect(() => {
    if (!initialPoId || !selectedProjectId || autoCreatedRef.current) return;
    autoCreatedRef.current = true;
    setIsCreating(true);

    async function autoCreate() {
      try {
        await loadAllReceipts(selectedProjectId ?? undefined);
        const currentReceipts = useReceiptStore.getState().receipts;
        const nextReceiptCode = generateNextCode(
          currentReceipts.map((r) => r.receipt_code),
          "NP-",
        );
        const today = new Date().toISOString().split("T")[0];
        const newId = await createEmptyReceipt({
          order_id: initialPoId!,
          receipt_code: nextReceiptCode,
          receipt_date: today,
        });
        navigate({ to: `/receipt/${newId}/edit`, replace: true });
      } catch (error: unknown) {
        setIsCreating(false);
        handleFormError(error, showToast);
      }
    }

    autoCreate();
  }, [initialPoId, selectedProjectId, loadAllReceipts, createEmptyReceipt, navigate, showToast]);

  async function handleSelectPO(poId: string) {
    if (!poId || isCreating) return;
    setIsCreating(true);

    try {
      const currentReceipts = useReceiptStore.getState().receipts;
      const nextReceiptCode = generateNextCode(
        currentReceipts.map((r) => r.receipt_code),
        "NP-",
      );
      const today = new Date().toISOString().split("T")[0];
      const newId = await createEmptyReceipt({
        order_id: poId,
        receipt_code: nextReceiptCode,
        receipt_date: today,
      });
      navigate({ to: `/receipt/${newId}/edit`, replace: true });
    } catch (error: unknown) {
      setIsCreating(false);
      handleFormError(error, showToast);
    }
  }

  if (!selectedProjectId) {
    return (
      <Layout
        height="fill"
        content={
          <LayoutContent padding={6}>
            <ProjectRequired>{null}</ProjectRequired>
          </LayoutContent>
        }
      />
    );
  }

  if (initialPoId || isCreating) {
    return <LoadingState message="Membuat Penerimaan Baru…" />;
  }

  const poOptions = orders.map((p) => ({
    label: `${p.order_code ?? "-"} (${p.project_name ?? "Proyek"})`,
    value: String(p.order_id),
  }));

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Penerimaan Baru</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Pilih pesanan (PO) untuk mulai mencatat penerimaan barang
              </Text>
            </VStack>
            <Button variant="secondary" label="Kembali" type="button" onClick={() => navigate({ to: "/receipt" })} />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <ProjectRequired>
            <VStack gap={4}>
              <Card>
                <VStack gap={3} padding={4}>
                  <Text weight="medium">Pilih Nomor Pesanan Pembelian (PO):</Text>
                  <Selector
                    isRequired
                    width={360}
                    label="Pilih Pesanan (PO)"
                    isLabelHidden
                    placeholder="Pilih nomor pesanan..."
                    hasSearch
                    searchPlaceholder="Cari nomor pesanan..."
                    options={poOptions}
                    onChange={(v) => handleSelectPO(v as string)}
                  />
                </VStack>
              </Card>
            </VStack>
          </ProjectRequired>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/receipt/new")({
  component: NewReceiptPage,
  validateSearch: searchSchema,
});
