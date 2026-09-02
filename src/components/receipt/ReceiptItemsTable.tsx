import { EmptyState, Table, Text, TextInput, VStack } from "@astryxdesign/core";
import { EntityCode } from "@/components/shared/EntityCode";
import { useTableRowIndex } from "@/components/shared/useTableRowIndex";
import { formatItemCode, formatNumber, sanitizeDecimalInput } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import { type TableColumn, pixel, proportional } from "@astryxdesign/core/Table";
import type { ReceiptItemRow } from "./form/receipt.schema";
import type { useReceiptForm } from "./form/useReceiptForm";

export interface ReceiptItemsTableProps {
  items: ReceiptItemRow[];
  form: ReturnType<typeof useReceiptForm>["form"];
}

export function ReceiptItemsTable({ items, form }: ReceiptItemsTableProps) {
  const columns: TableColumn<ReceiptItemRow>[] = [
    {
      header: "Kode Item",
      key: "item_code",
      width: pixel(160),
      renderCell: (row) => {
        const code = formatItemCode(row);
        return code ? <EntityCode id={code} /> : "-";
      },
    },
    {
      header: "Nama Item",
      key: "item_name",
      width: proportional(2),
      renderCell: (row) => <Text weight="medium">{row.item_name || "-"}</Text>,
    },
    {
      align: "end",
      header: "Harga (Rp)",
      key: "price",
      width: pixel(140),
      renderCell: (row) => <Text type="code">{formatNumber(row.price ?? 0)}</Text>,
    },
    {
      align: "end",
      header: "Volume Diterima",
      key: "qty",
      width: pixel(200),
      renderCell: (row) => {
        const idx = items.indexOf(row);
        return (
          <form.Field name={`items[${idx}].qty`}>
            {(qtyField) => (
              <TextInput
                label="Volume"
                isLabelHidden
                statusVariant="tooltip"
                value={String(qtyField.state.value ?? "")}
                onChange={(v) => qtyField.handleChange(sanitizeDecimalInput(v))}
                onBlur={qtyField.handleBlur}
                status={getFieldError(qtyField.state.meta.errors, qtyField.state.meta.isTouched)}
              />
            )}
          </form.Field>
        );
      },
    },
    {
      header: "Satuan",
      key: "unit",
      width: pixel(90),
      renderCell: (row) => row.unit || "-",
    },
    {
      align: "end",
      header: "Sisa PO",
      key: "remaining",
      width: pixel(120),
      renderCell: (row) => (
        <Text type="code" color="secondary">
          {formatNumber(row.remaining ?? 0)}
        </Text>
      ),
    },
  ];

  const rowIndexPlugin = useTableRowIndex({
    data: items,
    getRowKey: (item) => item.order_item_id,
  });

  return (
    <VStack paddingBlock={6}>
      <Table
        hasHover
        idKey="order_item_id"
        textOverflow="truncate"
        columns={columns}
        data={items}
        plugins={{ rowIndex: rowIndexPlugin }}
        emptyState={<EmptyState isCompact title="Tidak ada item untuk diterima" />}
      />
    </VStack>
  );
}
