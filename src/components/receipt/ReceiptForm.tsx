import { Button, Heading, HStack, Text, TextInput, VStack } from "@astryxdesign/core";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Banner } from "@astryxdesign/core/Banner";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { useReceiptForm } from "./form/useReceiptForm";
import { ReceiptItemsTable } from "./ReceiptItemsTable";
import { getFieldError } from "@/utils/form";
import type { ReceiptFormProps } from "./form/receipt.schema";

export type { ReceiptFormProps };

export function ReceiptForm({ initialPoId, initialEditId, onSuccess }: ReceiptFormProps) {
  const { form, orders, isEdit, handlePOChange } = useReceiptForm({ initialEditId, initialPoId, onSuccess });

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
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  variant="primary"
                  label={isEdit ? "Simpan Perubahan" : "Simpan Penerimaan"}
                  type="button"
                  onClick={() => form.handleSubmit()}
                  isLoading={isSubmitting}
                  isDisabled={!canSubmit}
                />
              )}
            </form.Subscribe>
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
                      onChange={(v) => handlePOChange(v as string)}
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
                      onBlur={field.handleBlur}
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
                      onChange={(v) => field.handleChange(v ?? "")}
                      onBlur={field.handleBlur}
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                    />
                  )}
                </form.Field>
              </HStack>
              <form.Subscribe selector={(state) => [state.isSubmitted, state.values.items] as const}>
                {([isSubmitted, items]) => (
                  <VStack gap={3}>
                    {isSubmitted && (
                      <form.Field name="items">
                        {(field) =>
                          field.state.meta.errors.length > 0 ? (
                            <Banner
                              status="error"
                              title={
                                typeof field.state.meta.errors[0] === "string"
                                  ? field.state.meta.errors[0]
                                  : (field.state.meta.errors[0] as any)?.message
                              }
                            />
                          ) : null
                        }
                      </form.Field>
                    )}
                    <ReceiptItemsTable items={items} form={form} />
                  </VStack>
                )}
              </form.Subscribe>
            </VStack>
          </ProjectRequired>
        </LayoutContent>
      }
    />
  );
}
