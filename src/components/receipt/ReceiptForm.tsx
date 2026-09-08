import { useNavigate } from "@tanstack/react-router";
import { Button, Heading, HStack, Text, TextInput, VStack } from "@astryxdesign/core";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { useToast } from "@astryxdesign/core/Toast";
import { LoadingState } from "@/components/shared/LoadingState";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { useReceiptStore } from "@/store/useReceiptStore";
import { getFieldError, handleFormError } from "@/utils/form";
import type { ReceiptFormProps } from "./form/receipt.schema";
import { useReceiptForm } from "./form/useReceiptForm";
import { ReceiptItemsTable } from "./ReceiptItemsTable";

export type { ReceiptFormProps };

export function ReceiptForm({ receiptId, onSuccess }: ReceiptFormProps) {
  const navigate = useNavigate();
  const showToast = useToast();
  const { updateReceiptHeader } = useReceiptStore();
  const { form, orderCode, orderId, items, loading, reloadData } = useReceiptForm({ receiptId });

  if (loading) {
    return <LoadingState message="Memuat data penerimaan..." />;
  }

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Edit Penerimaan</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Perbarui data penerimaan barang
              </Text>
            </VStack>
            <Button
              variant="primary"
              label="Simpan"
              type="button"
              onClick={() => {
                const poId = orderId || form.getFieldValue("order_id");
                if (onSuccess && poId) {
                  onSuccess(poId);
                } else if (poId) {
                  navigate({ to: `/order/${poId}` });
                } else {
                  navigate({ to: "/receipt" });
                }
              }}
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
                <form.Field name="receipt_code">
                  {(field) => (
                    <TextInput
                      isRequired
                      width={240}
                      label="Nomor Penerimaan"
                      statusVariant="tooltip"
                      value={field.state.value}
                      onChange={(v) => field.handleChange(v)}
                      onBlur={async () => {
                        field.handleBlur();
                        if (field.state.value) {
                          try {
                            await updateReceiptHeader(receiptId, { receipt_code: field.state.value });
                          } catch (error: unknown) {
                            handleFormError(error, showToast);
                          }
                        }
                      }}
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                    />
                  )}
                </form.Field>
                <form.Field name="receipt_date">
                  {(field) => (
                    <DateInput
                      isRequired
                      width={240}
                      format="system_date"
                      label="Tanggal Penerimaan"
                      statusVariant="tooltip"
                      value={field.state.value as DateInputProps["value"]}
                      onChange={async (v) => {
                        const val = v ?? "";
                        field.handleChange(val);
                        if (val) {
                          try {
                            await updateReceiptHeader(receiptId, { receipt_date: val });
                          } catch (error: unknown) {
                            handleFormError(error, showToast);
                          }
                        }
                      }}
                      onBlur={async () => {
                        field.handleBlur();
                        if (field.state.value) {
                          try {
                            await updateReceiptHeader(receiptId, { receipt_date: field.state.value });
                          } catch (error: unknown) {
                            handleFormError(error, showToast);
                          }
                        }
                      }}
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                    />
                  )}
                </form.Field>
              </HStack>
              <ReceiptItemsTable items={items} receiptId={receiptId} orderId={orderId} onItemUpdated={reloadData} />
            </VStack>
          </ProjectRequired>
        </LayoutContent>
      }
    />
  );
}
