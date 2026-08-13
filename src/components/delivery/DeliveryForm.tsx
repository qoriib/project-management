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
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeliveryForm({ initialPoId, onSuccess, onCancel }: DeliveryFormProps) {
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
      await deliveryRepo.createWithItems(
        { po_id: Number(value.poId), delivery_date: value.deliveryDate },
        itemsToSave.map((it) => ({ po_item_id: it.po_item_id, qty: it.qty }))
      );
      onSuccess();
    },
  });

  useEffect(() => {
    async function loadPOs() {
      const p = await purchaseOrderRepo.findAllWithSummary({ project_id: selectedProjectId || undefined });
      setPOs(p);
      if (initialPoId) {
        const items = await purchaseOrderRepo.findItems(Number(initialPoId));
        form.setFieldValue(
          "items",
          items.map((i) => ({ po_item_id: i.po_item_id, item_name: i.item_name || "", unit: i.unit || "", sisa: i.sisa || 0, qty: 0 }))
        );
      }
    }
    loadPOs();
  }, [initialPoId, form, selectedProjectId]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
      <form.Subscribe
        selector={(state) => [state.values.poId, state.values.items, state.canSubmit, state.isSubmitting, state.errors] as const}
      >
        {([selectedPoId, items, canSubmit, isSubmitting, formErrors]) => {
          return (
            <VStack gap={6}>
              <Card padding={4}>
                <VStack gap={4}>
                  <Heading level={3}>Informasi Penerimaan</Heading>
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
                            status={getFieldError(field.state.meta.errors)}
                            isRequired
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
                            status={getFieldError(field.state.meta.errors)}
                            isRequired
                          />
                        )}
                      />
                    </div>
                  </HStack>
                </VStack>
              </Card>

              {selectedPoId && items.length > 0 && (
                <Card padding={4}>
                  <VStack gap={4}>
                    <Heading level={3}>Daftar Item Diterima</Heading>
                    <Text color="secondary" size="sm">Isi volume yang diterima untuk masing-masing material.</Text>

                    {formErrors?.length > 0 && (
                      <Text size="sm" style={{ color: '#e3193b' }}>{String(formErrors[0])}</Text>
                    )}

                    <Table
                      columns={[
                        { key: "item", header: "Barang / Material", width: proportional(2), renderCell: (row: any) => <Text weight="medium">{row.item_name}</Text> },
                        {
                          key: "sisa", header: "Sisa PO", width: pixel(150),
                          renderCell: (row: any) => <Text size="sm">{formatNumber(row.sisa, 2)} {row.unit}</Text>
                        },
                        {
                          key: "qty", header: "Volume Diterima", width: pixel(200),
                          renderCell: (row: any) => {
                            const idx = items.indexOf(row);
                            return (
                              <form.Field name={`items[${idx}]`}>
                                {(field) => {
                                  // The error is on the array element itself because of v.custom
                                  const err = getFieldError(field.state.meta.errors);
                                  return (
                                    <form.Field name={`items[${idx}].qty`}>
                                      {(qtyField) => (
                                        <NumberInput
                                          label="Volume"
                                          isLabelHidden
                                          value={qtyField.state.value}
                                          onChange={(v) => qtyField.handleChange(v || 0)}
                                          onBlur={qtyField.handleBlur}
                                          statusVariant="attached"
                                          status={err || getFieldError(qtyField.state.meta.errors)}
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
                <Button variant="ghost" label="Batal" type="button" onClick={onCancel} />
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
