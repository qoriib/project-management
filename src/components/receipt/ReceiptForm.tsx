import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, Heading, HStack, Text, TextInput, VStack } from "@astryxdesign/core";
import { DateInput, DateInputProps } from "@astryxdesign/core/DateInput";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { useToast } from "@astryxdesign/core/Toast";
import { LoadingState } from "@/components/shared/LoadingState";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { useReceiptStore } from "@/store/useReceiptStore";
import { handleFormError } from "@/utils/form";
import { parseDecimalInput, todayISO } from "@/utils/formatters";
import { useReceiptForm } from "./form/useReceiptForm";
import { ReceiptItemsTable } from "./ReceiptItemsTable";
import type { ReceiptFormProps } from "./form/receipt.schema";

export type { ReceiptFormProps };

export function ReceiptForm({ receiptId, onSuccess }: ReceiptFormProps) {
  const navigate = useNavigate();
  const showToast = useToast();

  const [qtyValues, setQtyValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { updateReceiptHeader, upsertReceiptItem } = useReceiptStore();
  const { orderCode, orderId, receiptCode, setReceiptCode, receiptDate, setReceiptDate, items, loading } =
    useReceiptForm(receiptId);

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const item of items) {
      initial[item.order_item_id] = String(item.qty ?? "");
    }
    setQtyValues(initial);
  }, [items]);

  if (loading) {
    return <LoadingState message="Memuat data penerimaan..." />;
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);

      await updateReceiptHeader(receiptId, { receipt_code: receiptCode, receipt_date: receiptDate });

      await Promise.all(
        items.map((item) =>
          upsertReceiptItem(
            receiptId,
            orderId,
            item.order_item_id,
            parseDecimalInput(qtyValues[item.order_item_id] ?? String(item.qty ?? "")),
          ),
        ),
      );

      if (onSuccess && orderId) {
        onSuccess(orderId);
      } else {
        navigate({ to: orderId ? `/order/${orderId}` : "/receipt" });
      }
    } catch (error: unknown) {
      handleFormError(error, showToast);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Edit Penerimaan</Heading>
              <Text color="secondary">Perbarui data penerimaan barang</Text>
            </VStack>
            <Button
              variant="primary"
              label="Simpan"
              type="button"
              isLoading={isSaving}
              isDisabled={isSaving}
              onClick={handleSave}
            />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <ProjectRequired>
            <VStack gap={4}>
              <HStack gap={3} wrap="wrap">
                <TextInput isReadOnly width={240} label="Nomor Pesanan (PO)" value={orderCode || "-"} />
                <TextInput width={240} label="Nomor Penerimaan" value={receiptCode} onChange={setReceiptCode} />
                <DateInput
                  width={240}
                  format="system_date"
                  label="Tanggal Penerimaan"
                  value={receiptDate as DateInputProps["value"]}
                  onChange={(dateVal) => setReceiptDate(dateVal ?? todayISO())}
                />
              </HStack>
              <ReceiptItemsTable
                items={items}
                qtyValues={qtyValues}
                onQtyChange={(id, val) => setQtyValues((prev) => ({ ...prev, [id]: val }))}
              />
            </VStack>
          </ProjectRequired>
        </LayoutContent>
      }
    />
  );
}
