import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { VStack, HStack, Button, Selector, Card, Heading, Text, Table } from "@astryxdesign/core";
import { DateInput } from "@astryxdesign/core/DateInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { purchaseOrderRepo, deliveryRepo, type POWithSummary } from "@/db/repositories";
import { todayISO, formatNumber } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";
import { getFieldError } from "@/utils/form";
import * as v from "valibot";

const deliverySchema = v.object({
  poId: v.pipe(v.string(), v.nonEmpty("PO harus dipilih.")),
  deliveryDate: v.pipe(v.string(), v.nonEmpty("Tanggal kirim harus diisi.")),
  items: v.pipe(
    v.array(
      v.pipe(
        v.object({
          po_item_id: v.number(),
          item_name: v.string(),
          unit: v.string(),
          sisa: v.number(),
          qty: v.number(),
        }),
        v.custom((item: any) => item.qty <= item.sisa, "Volume melebihi sisa PO.")
      )
    ),
    v.custom((items: any) => items.some((it: any) => it.qty > 0), "Minimal ada 1 item yang diterima.")
  )
});

interface DeliveryFormProps {
  initialPoId?: string;
  initialEditId?: number;
  onSuccess: (poId: number) => void;
  onCancel: () => void;
}

export function DeliveryForm({ initialPoId, initialEditId, onSuccess, onCancel }: DeliveryFormProps) {
  const isEdit = !!initialEditId;
  const [pos, setPOs] = useState<POWithSummary[]>([]);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const form = useForm({
    defaultValues: {
      poId: initialPoId || "",
      deliveryDate: todayISO(),
      items: [] as { po_item_id: number; item_name: string; unit: string; sisa: number; qty: number }[],
    },
    validators: {
      onChange: deliverySchema,
    },
    onSubmit: async ({ value }) => {
      const itemsToSave = value.items.filter((it) => it.qty > 0);
      if (isEdit) {
        await deliveryRepo.updateWithItems(
          initialEditId,
          { po_id: Number(value.poId), delivery_date: value.deliveryDate },
          itemsToSave.map((it) => ({ po_item_id: it.po_item_id, qty: it.qty }))
        );
      } else {
        await deliveryRepo.createWithItems(
          { po_id: Number(value.poId), delivery_date: value.deliveryDate },
          itemsToSave.map((it) => ({ po_item_id: it.po_item_id, qty: it.qty }))
        );
      }
      onSuccess(Number(value.poId));
    },
  });

  useEffect(() => {
    async function loadData() {
      const p = await purchaseOrderRepo.findAllWithSummary({ project_id: selectedProjectId || undefined });
      setPOs(p);

      if (isEdit) {
        const d = await deliveryRepo.findById(initialEditId);
        if (d) {
          form.setFieldValue("poId", String(d.po_id));
          form.setFieldValue("deliveryDate", d.delivery_date);

          const poItems = await purchaseOrderRepo.findItems(d.po_id);
          const delivItems = await deliveryRepo.findItems(initialEditId);
          
          form.setFieldValue(
            "items",
            poItems.map((i) => {
              const old = delivItems.find(di => di.po_item_id === i.po_item_id);
              const oldQty = old ? old.qty : 0;
              return {
                po_item_id: i.po_item_id,
                item_name: i.item_name || "",
                unit: i.unit || "",
                sisa: (i.sisa || 0) + oldQty,
                qty: oldQty
              };
            })
          );
        }
      } else if (initialPoId) {
        const items = await purchaseOrderRepo.findItems(Number(initialPoId));
        form.setFieldValue(
          "items",
          items.map((i) => ({ po_item_id: i.po_item_id, item_name: i.item_name || "", unit: i.unit || "", sisa: i.sisa || 0, qty: 0 }))
        );
      }
    }
    loadData();
  }, [initialPoId, initialEditId, isEdit, form, selectedProjectId]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
      <form.Subscribe
        selector={(state) => [state.values.poId, state.values.items, state.canSubmit, state.isSubmitting] as const}
      >
        {([selectedPoId, items, canSubmit, isSubmitting]) => {
          return (
            <VStack gap={6}>
              <Card padding={4}>
                <HStack gap={4} style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <form.Field
                      name="poId"
                      children={(field) => (
                        <Selector
                          label="Pilih PO"
                          value={field.state.value}
                          onChange={async (v) => {
                            const strVal = v as string;
                            field.handleChange(strVal);
                            if (strVal) {
                              const poItems = await purchaseOrderRepo.findItems(Number(strVal));
                              form.setFieldValue(
                                "items",
                                poItems.map((i) => ({ po_item_id: i.po_item_id, item_name: i.item_name || "", unit: i.unit || "", sisa: i.sisa || 0, qty: 0 }))
                              );
                            } else {
                              form.setFieldValue("items", []);
                            }
                          }}
                          onBlur={field.handleBlur}
                          statusVariant="attached"
                          status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                          isRequired
                          isDisabled={isEdit}
                          options={[
                            { value: "", label: "Pilih nomor PO..." },
                            ...pos.map((p: any) => ({ value: String(p.po_id), label: `PO-${p.po_id} (${p.vendor_names || "Tidak ada vendor"})` })),
                          ]}
                        />
                      )}
                    />
                  </div>

                  <div style={{ width: 240 }}>
                    <form.Field
                      name="deliveryDate"
                      children={(field) => (
                        <DateInput
                          label="Tanggal Kirim / Terima"
                          value={field.state.value as any}
                          onChange={(v) => field.handleChange(v || "")}
                          onBlur={field.handleBlur}
                          statusVariant="attached"
                          status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                          isRequired
                        />
                      )}
                    />
                  </div>
                </HStack>
              </Card>

              {selectedPoId && items.length > 0 && (
                <Card padding={4}>
                  <VStack gap={4}>
                    <Heading level={3}>Daftar Item Diterima</Heading>

                    <form.Field name="items">
                      {(field) => field.state.meta.errors.length > 0 && (
                        <Text size="sm" style={{ color: '#e3193b' }}>
                          {typeof field.state.meta.errors[0] === 'string' ? field.state.meta.errors[0] : field.state.meta.errors[0]?.message}
                        </Text>
                      )}
                    </form.Field>

                    <Table
                      columns={[
                        { key: "item", header: "Barang / Material", width: proportional(2), renderCell: (row: any) => <Text weight="medium">{row.item_name}</Text> },
                        {
                          key: "sisa", header: "Sisa PO", width: pixel(180),
                          renderCell: (row: any) => {
                            const sisaAkhir = row.sisa - row.qty;

                            return (
                              <VStack gap={0.5}>
                                <Text size="sm" weight="medium">
                                  {formatNumber(sisaAkhir, 2)} {row.unit} (Sisa)
                                </Text>
                                <Text size="sm" color="secondary">Batas PO: {formatNumber(row.sisa, 2)} {row.unit}</Text>
                              </VStack>
                            );
                          }
                        },
                        {
                          key: "qty", header: "Volume Diterima", width: pixel(200),
                          renderCell: (row: any) => {
                            const idx = items.indexOf(row);
                            return (
                              <form.Field name={`items[${idx}]`}>
                                {(field) => {
                                  // The error is on the array element itself because of v.custom
                                  const err = getFieldError(field.state.meta.errors, !!field.state.meta.isTouched);
                                  return (
                                    <form.Field 
                                      name={`items[${idx}].qty`}
                                      validators={{
                                        onChange: ({ value }) => value > row.sisa ? `Melebihi sisa PO (${formatNumber(row.sisa, 2)}).` : undefined
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
                                          status={err || getFieldError(qtyField.state.meta.errors, qtyField.state.meta.isTouched)}
                                        />
                                      )}
                                    </form.Field>
                                  );
                                }}
                              </form.Field>
                            );
                          }
                        },
                        { key: "unit", header: "Satuan", width: pixel(100), renderCell: (row: any) => <Text size="sm">{row.unit}</Text> },
                      ]}
                      data={items as any}
                    />
                  </VStack>
                </Card>
              )}

              <HStack gap={2} justify="end">
                <Button variant="secondary" label="Batal" type="button" onClick={onCancel} />
                <Button
                  variant="primary"
                  label="Simpan Pengiriman"
                  type="submit"
                  isLoading={isSubmitting}
                  isDisabled={!canSubmit}
                />
              </HStack>
            </VStack>
          );
        }}
      </form.Subscribe>
    </form>
  );
}
