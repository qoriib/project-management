import { HStack, VStack, Card, Button, Text } from "@astryxdesign/core";
import { Item } from "@astryxdesign/core/Item";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { TextInput } from "@astryxdesign/core/TextInput";
import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Banner } from "@astryxdesign/core/Banner";
import { useReceiptForm } from "./form/useReceiptForm";
import { ReceiptQtyCell } from "./form/ReceiptQtyCell";
import { EntityCode } from "@/components/shared/EntityCode";
import { formatItemCode, formatNumber } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { Table, type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { ReceiptFormProps, ReceiptItemRow } from "./form/receipt.schema";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";

export type { ReceiptFormProps };

interface ReceiptItemsTableProps {
  items: ReceiptItemRow[];
  form: ReturnType<typeof useReceiptForm>["form"];
}

function ReceiptItemsTable({ items, form }: ReceiptItemsTableProps) {
  const columns: TableColumn<ReceiptItemRow>[] = [
    {
      header: "Item",
      key: "item",
      width: proportional(2),
      renderCell: (row) => {
        const code = formatItemCode(row);
        return (
          <Item density="compact" label={row.item_name} description={code ? <EntityCode id={code} /> : undefined} />
        );
      },
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(180),
      renderCell: (row) => <Text type="code">{formatNumber(row.price ?? 0)}</Text>,
    },
    {
      align: "end",
      header: "Volume",
      key: "qty",
      width: pixel(180),
      renderCell: (row) => {
        const idx = items.indexOf(row);
        return <ReceiptQtyCell form={form as any} row={row} idx={idx} />;
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(100),
      renderCell: (row) => row.unit || "-",
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: items,
    getRowKey: (item) => item.order_item_id,
    label: "#",
  });

  return (
    <Card>
      <Table
        textOverflow="truncate"
        columns={columns}
        data={items}
        idKey="order_item_id"
        plugins={{ rowIndex: rowIndexPlugin }}
      />
    </Card>
  );
}

export function ReceiptForm({ initialPoId, initialEditId, onSuccess, onCancel }: ReceiptFormProps) {
  const { form, orders, isEdit, handlePOChange } = useReceiptForm({
    initialEditId,
    initialPoId,
    onSuccess,
  });

  const poOptions = orders.map((p) => ({
    label: p.order_code,
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
        <HStack width={720}>
          <FormLayout direction="horizontal">
            <form.Field name="order_id">
              {(field) => (
                <Selector
                  label="Pilih Order"
                  value={field.state.value}
                  onChange={(v) => handlePOChange(v as string)}
                  onBlur={field.handleBlur}
                  hasSearch
                  searchPlaceholder="Cari order..."
                  statusVariant="tooltip"
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                  isRequired
                  isDisabled={isEdit}
                  options={poOptions}
                />
              )}
            </form.Field>
            <form.Field name="receipt_code">
              {(field) => (
                <TextInput
                  label="Kode Penerimaan"
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  onBlur={field.handleBlur}
                  statusVariant="tooltip"
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                  isRequired
                />
              )}
            </form.Field>
            <form.Field name="receipt_date">
              {(field) => (
                <DateInput
                  format="system_date"
                  label="Tanggal Terima"
                  statusVariant="tooltip"
                  value={field.state.value as DateInputProps["value"]}
                  onChange={(v) => field.handleChange(v ?? "")}
                  onBlur={field.handleBlur}
                  status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                  isRequired
                />
              )}
            </form.Field>
          </FormLayout>
        </HStack>

        <form.Subscribe selector={(state) => [state.values.order_id, state.values.items] as const}>
          {([poId, items]) => {
            if (!poId || items.length === 0) return null;
            return <ReceiptItemsTable items={items} form={form} />;
          }}
        </form.Subscribe>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isSubmitted] as const}>
          {([canSubmit, isSubmitting, isSubmitted]) => (
            <VStack gap={4}>
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
              <HStack gap={2} justify="end">
                <Button variant="secondary" label="Batal" type="button" onClick={onCancel} />
                <Button
                  variant="primary"
                  label="Simpan"
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
