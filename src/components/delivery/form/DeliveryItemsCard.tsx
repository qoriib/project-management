import { Card, VStack, Heading, Text, Table } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { formatNumber } from "@/utils/formatters";
import { getFieldError } from "@/utils/form";
import type { DeliveryItemRow } from "./delivery.schema";
import type { useDeliveryForm } from "./useDeliveryForm";

interface DeliveryItemsCardProps {
  form: ReturnType<typeof useDeliveryForm>["form"];
  items: DeliveryItemRow[];
}

// ── Column definitions ────────────────────────────────────────────────────────

function buildDeliveryItemColumns(
  form: DeliveryItemsCardProps["form"],
  items: DeliveryItemRow[]
): TableColumn<DeliveryItemRow>[] {
  return [
    {
      key: "item",
      header: "Barang / Material",
      width: proportional(2),
      renderCell: (row) => <Text weight="medium">{row.item_name}</Text>,
    },
    {
      key: "sisa",
      header: "Sisa PO",
      width: pixel(180),
      renderCell: (row) => {
        const sisaAkhir = row.sisa - row.qty;
        return (
          <VStack gap={0.5}>
            <Text size="sm" weight="medium">
              {formatNumber(sisaAkhir, 2)} {row.unit} (Sisa)
            </Text>
            <Text size="sm" color="secondary">
              Batas PO: {formatNumber(row.sisa, 2)} {row.unit}
            </Text>
          </VStack>
        );
      },
    },
    {
      key: "qty",
      header: "Volume Diterima",
      width: pixel(200),
      renderCell: (row) => {
        const idx = items.indexOf(row);
        return (
          // Outer Field: tangkap error level-item (dari v.custom per row)
          <form.Field name={`items[${idx}]`}>
            {(field) => {
              const rowErr = getFieldError(
                field.state.meta.errors,
                !!field.state.meta.isTouched
              );
              return (
                // Inner Field: tangkap error level-qty (dari validator onChange)
                <form.Field
                  name={`items[${idx}].qty`}
                  validators={{
                    onChange: ({ value }) =>
                      value > row.sisa
                        ? `Melebihi sisa PO (${formatNumber(row.sisa, 2)}).`
                        : undefined,
                  }}
                >
                  {(qtyField) => (
                    <NumberInput
                      label="Volume"
                      isLabelHidden
                      value={qtyField.state.value}
                      onChange={(v) => qtyField.handleChange(v || 0)}
                      onBlur={qtyField.handleBlur}
                      statusVariant="attached"
                      status={
                        rowErr ||
                        getFieldError(
                          qtyField.state.meta.errors,
                          qtyField.state.meta.isTouched
                        )
                      }
                    />
                  )}
                </form.Field>
              );
            }}
          </form.Field>
        );
      },
    },
    {
      key: "unit",
      header: "Satuan",
      width: pixel(100),
      renderCell: (row) => <Text size="sm">{row.unit}</Text>,
    },
  ];
}

// ── DeliveryItemsCard ─────────────────────────────────────────────────────────

/**
 * Card yang menampilkan tabel item delivery dengan input volume.
 * Hanya muncul setelah PO dipilih dan memiliki item.
 */
export function DeliveryItemsCard({ form, items }: DeliveryItemsCardProps) {
  const columns = buildDeliveryItemColumns(form, items);

  return (
    <Card padding={4}>
      <VStack gap={4}>
        <Heading level={3}>Daftar Item Diterima</Heading>

        {/* Banner error level-array (minimal 1 item harus > 0) */}
        <form.Field name="items">
          {(field) =>
            field.state.meta.errors.length > 0 ? (
              <Text size="sm" style={{ color: "#e3193b" }}>
                {typeof field.state.meta.errors[0] === "string"
                  ? field.state.meta.errors[0]
                  : (
                      field.state.meta.errors[0] as { message?: string }
                    )?.message}
              </Text>
            ) : null
          }
        </form.Field>

        <Table
          verticalAlign="top"
          columns={columns}
          data={items}
        />
      </VStack>
    </Card>
  );
}
