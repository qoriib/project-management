import { Button, HStack, TextInput, VStack } from "@astryxdesign/core";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Banner } from "@astryxdesign/core/Banner";
import { useReceiptForm } from "./form/useReceiptForm";
import { ReceiptItemsTable } from "./ReceiptItemsTable";
import { getFieldError } from "@/utils/form";
import type { ReceiptFormProps } from "./form/receipt.schema";

export type { ReceiptFormProps };

export function ReceiptForm({ initialPoId, initialEditId, onSuccess, onCancel }: ReceiptFormProps) {
  const { form, orders, isEdit, handlePOChange } = useReceiptForm({
    initialEditId,
    initialPoId,
    onSuccess,
  });

  const poOptions = orders.map((p) => ({
    label: p.order_code ?? "-",
    value: String(p.order_id),
  }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
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
        <form.Subscribe selector={(state) => [state.values.order_id, state.values.items] as const}>
          {([poId, items]) => {
            if (!poId || items.length === 0) return null;
            return <ReceiptItemsTable items={items} form={form} />;
          }}
        </form.Subscribe>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isSubmitted] as const}>
          {([canSubmit, isSubmitting, isSubmitted]) => (
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
              <HStack gap={2} justify="end" wrap="wrap">
                <Button variant="secondary" label="Batal" type="button" onClick={onCancel} />
                <Button
                  variant="primary"
                  label={isEdit ? "Simpan Perubahan" : "Simpan Penerimaan"}
                  type="submit"
                  isLoading={isSubmitting}
                  isDisabled={!canSubmit}
                />
              </HStack>
            </VStack>
          )}
        </form.Subscribe>
      </VStack>
    </form>
  );
}
