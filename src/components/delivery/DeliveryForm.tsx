import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { VStack, HStack, Button, Selector, Card, Heading, Text, Table } from "@astryxdesign/core";
import { DateInput } from "@astryxdesign/core/DateInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { purchaseOrderRepo, deliveryRepo, type POWithSummary } from "@/db/repositories";
import { todayISO, formatNumber } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";

interface DeliveryFormProps {
  initialPoId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeliveryForm({ initialPoId, onSuccess, onCancel }: DeliveryFormProps) {
  const [pos, setPOs] = useState<POWithSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const form = useForm({
    defaultValues: {
      poId: initialPoId || "",
      deliveryDate: todayISO(),
      items: [] as { po_item_id: number; item_name: string; unit: string; sisa: number; qty: number }[],
    },
    onSubmit: async ({ value }) => {
      setSaving(true);
      try {
        const itemsToSave = value.items.filter((it) => it.qty > 0);
        await deliveryRepo.createWithItems(
          { po_id: Number(value.poId), delivery_date: value.deliveryDate },
          itemsToSave.map((it) => ({ po_item_id: it.po_item_id, qty: it.qty }))
        );
        onSuccess();
      } finally {
        setSaving(false);
      }
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
        selector={(state) => [state.values.poId, state.values.deliveryDate, state.values.items] as const}
      >
        {([selectedPoId, deliveryDate, items]) => {
          const hasValidDelivery = items.some((it) => it.qty > 0);
          const hasOverlimit = items.some((it) => it.qty > it.sisa);
          const isValid = selectedPoId !== "" && deliveryDate !== "" && hasValidDelivery && !hasOverlimit;

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
                              <form.Field name={`items[${idx}].qty`}>
                                {(field) => {
                                  const isOverlimit = field.state.value > row.sisa;
                                  return (
                                    <NumberInput
                                      label="Volume"
                                      isLabelHidden
                                      value={field.state.value}
                                      onChange={(v) => field.handleChange(v)}
                                      status={isOverlimit ? { type: "warning", message: "Melebihi sisa PO" } : undefined}
                                    />
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
                  isLoading={saving}
                  isDisabled={!isValid}
                />
              </HStack>
            </VStack>
          );
        }}
      </form.Subscribe>
    </form>
  );
}
