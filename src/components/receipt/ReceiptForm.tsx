import { useNavigate } from "@tanstack/react-router";
import { Button, Heading, HStack, Text, TextInput, VStack } from "@astryxdesign/core";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { useToast } from "@astryxdesign/core/Toast";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { useReceiptStore } from "@/store/useReceiptStore";
import { useReceiptForm } from "./form/useReceiptForm";
import { ReceiptItemsTable } from "./ReceiptItemsTable";
import { getFieldError, handleFormError } from "@/utils/form";
import type { ReceiptFormProps } from "./form/receipt.schema";

export type { ReceiptFormProps };

export function ReceiptForm({ initialPoId, initialEditId, onSuccess }: ReceiptFormProps) {
  const navigate = useNavigate();
  const showToast = useToast();
  const { updateReceiptHeader } = useReceiptStore();
  const { form, orders, isEdit } = useReceiptForm({ initialEditId, initialPoId, onSuccess });

  const poOptions = orders.map((p) => ({ label: p.order_code ?? "-", value: String(p.order_id) }));

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>{isEdit ? "Edit Penerimaan" : "Penerimaan Baru"}</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                {isEdit ? "Perbarui data penerimaan barang" : "Catat bukti penerimaan barang masuk"}
              </Text>
            </VStack>
            <Button
              variant="secondary"
              label="Kembali"
              type="button"
              onClick={() => {
                const poId = form.getFieldValue("order_id");
                if (poId) {
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
                <form.Field name="order_id">
                  {(field) => (
                    <Selector
                      isRequired
                      width={240}
                      label="Pilih Pesanan (PO)"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      hasSearch
                      searchPlaceholder="Cari nomor pesanan..."
                      statusVariant="tooltip"
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                      isDisabled={isEdit}
                      options={poOptions}
                    />
                  )}
                </form.Field>
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
                        if (initialEditId && field.state.value) {
                          try {
                            await updateReceiptHeader(initialEditId, { receipt_code: field.state.value });
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
                        if (initialEditId && val) {
                          try {
                            await updateReceiptHeader(initialEditId, { receipt_date: val });
                          } catch (error: unknown) {
                            handleFormError(error, showToast);
                          }
                        }
                      }}
                      onBlur={async () => {
                        field.handleBlur();
                        if (initialEditId && field.state.value) {
                          try {
                            await updateReceiptHeader(initialEditId, { receipt_date: field.state.value });
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
              <form.Subscribe selector={(state) => [state.values.items, state.values.order_id] as const}>
                {([items, orderId]) => (
                  <ReceiptItemsTable items={items} form={form} receiptId={initialEditId} orderId={orderId} />
                )}
              </form.Subscribe>
            </VStack>
          </ProjectRequired>
        </LayoutContent>
      }
    />
  );
}
