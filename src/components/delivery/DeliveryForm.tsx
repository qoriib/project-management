import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { VStack, HStack, Button, TextInput, Selector, TextArea, Card, Heading, Text, StatusDot } from "@astryxdesign/core";
import { getPurchaseOrders, getPOItems, type PurchaseOrder, type POItem } from "@/db/queries/po";
import { createDelivery } from "@/db/queries/field";
import { todayISO, formatNumber } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";

interface DeliveryFormProps {
  initialPoId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeliveryForm({ initialPoId, onSuccess, onCancel }: DeliveryFormProps) {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [poItems, setPOItems] = useState<POItem[]>([]);
  const [saving, setSaving] = useState(false);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const form = useForm({
    defaultValues: {
      poId: initialPoId || "",
      poItemId: "",
      deliveryDate: todayISO(),
      deliveredVolume: "",
      deliveryNoteNumber: "",
      locationDestination: "",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      setSaving(true);
      try {
        await createDelivery({
          po_item_id: Number(value.poItemId),
          delivery_date: value.deliveryDate,
          delivered_volume: parseFloat(value.deliveredVolume) || 0,
          delivery_note_number: value.deliveryNoteNumber,
          location_destination: value.locationDestination,
          notes: value.notes,
        });
        onSuccess();
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    async function loadPOs() {
      const p = await getPurchaseOrders({ project_id: selectedProjectId || undefined });
      setPOs(p);
      if (initialPoId) {
        const items = await getPOItems(Number(initialPoId));
        setPOItems(items);
        if (items.length > 0 && !form.state.values.poItemId) {
          form.setFieldValue("poItemId", String(items[0].po_item_id));
        }
      }
    }
    loadPOs();
  }, [initialPoId, form, selectedProjectId]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
      <form.Subscribe
        selector={(state) => [state.values.poId, state.values.poItemId, state.values.deliveredVolume, state.values.deliveryDate] as const}
      >
        {([selectedPoId, selectedPoItemId, deliveredVolumeStr, deliveryDate]) => {
          const activeItem = poItems.find((i) => i.po_item_id === Number(selectedPoItemId));
          const sisaVolume = activeItem ? activeItem.sisa ?? 0 : 0;
          const inputVol = parseFloat(deliveredVolumeStr) || 0;
          const isOverlimit = inputVol > sisaVolume;
          
          const isValid = selectedPoItemId !== "" && deliveryDate !== "" && deliveredVolumeStr !== "";

          return (
            <VStack gap={6}>
        <Card padding={4}>
          <VStack gap={4}>
            <Heading level={3}>Hubungkan dengan Purchase Order (PO)</Heading>
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
                          const items = await getPOItems(Number(strVal));
                          setPOItems(items);
                          if (items.length > 0) {
                            form.setFieldValue("poItemId", String(items[0].po_item_id));
                          } else {
                            form.setFieldValue("poItemId", "");
                          }
                        } else {
                          setPOItems([]);
                          form.setFieldValue("poItemId", "");
                        }
                      }}
                      isRequired
                      options={[
                        { value: "", label: "Pilih nomor PO..." },
                        ...pos.map((p) => ({ value: String(p.po_id), label: `${p.po_number} (${p.vendor_name})` })),
                      ]}
                    />
                  )}
                />
              </div>

              {selectedPoId && (
                <div style={{ flex: 1 }}>
                  <form.Field
                    name="poItemId"
                    children={(field) => (
                      <Selector
                        label="Pilih Item PO"
                        value={field.state.value}
                        onChange={(v) => field.handleChange(v as string)}
                        isRequired
                        options={poItems.map((i) => ({
                          value: String(i.po_item_id),
                          label: `${i.item_name} (Sisa: ${formatNumber(i.sisa, 2)} ${i.unit})`,
                        }))}
                      />
                    )}
                  />
                </div>
              )}
            </HStack>

            {activeItem && (
              <Card padding={3} style={{ borderLeft: "4px solid var(--color-accent-500)" }}>
                <VStack gap={1}>
                  <Text size="2xs" color="secondary">Detail Item PO</Text>
                  <Text size="sm"><strong>{activeItem.item_name}</strong></Text>
                  <Text size="2xs" color="secondary">
                    Volume Kontrak PO: {formatNumber(activeItem.ordered_volume, 2)} {activeItem.unit} |
                    Terkirim: {formatNumber(activeItem.total_terkirim, 2)} {activeItem.unit} |
                    Sisa Kontrak: {formatNumber(sisaVolume, 2)} {activeItem.unit}
                  </Text>
                </VStack>
              </Card>
            )}
          </VStack>
        </Card>

        {selectedPoItemId && (
          <Card padding={4}>
            <VStack gap={4}>
              <Heading level={3}>Informasi Surat Jalan / Realisasi</Heading>

              <HStack gap={4} style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <form.Field
                    name="deliveryDate"
                    children={(field) => (
                      <TextInput
                        label="Tanggal Kirim / Terima"
                        type="date"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e)}
                        isRequired
                      />
                    )}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <form.Field
                    name="deliveredVolume"
                    children={(field) => (
                      <TextInput
                        label={`Volume Kirim (${activeItem?.unit ?? ""})`}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e)}
                        isRequired
                        status={isOverlimit ? { type: "warning", message: "Melebihi sisa kontrak PO!" } : undefined}
                      />
                    )}
                  />
                </div>

                {activeItem && (
                  <HStack gap={2} align="center" style={{ flex: 1, height: "40px", marginTop: "24px" }}>
                    <StatusDot variant={isOverlimit ? "warning" : "success"} label={isOverlimit ? "Overlimit" : "Within limit"} />
                    <Text size="2xs" color="secondary">
                      {isOverlimit ? "Volume melebihi sisa PO" : "Volume dalam batas PO"}
                    </Text>
                  </HStack>
                )}
              </HStack>

              <HStack gap={4}>
                <div style={{ flex: 1 }}>
                  <form.Field
                    name="deliveryNoteNumber"
                    children={(field) => (
                      <TextInput
                        label="Nomor Surat Jalan"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e)}
                        placeholder="Contoh: SJ-00892"
                      />
                    )}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <form.Field
                    name="locationDestination"
                    children={(field) => (
                      <TextInput
                        label="Lokasi Tujuan / Dump Site"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e)}
                        placeholder="Contoh: Sulusuban STA 12+400"
                      />
                    )}
                  />
                </div>
              </HStack>

              <form.Field
                name="notes"
                children={(field) => (
                  <TextArea
                    label="Keterangan Ritase / Plat Mobil"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e)}
                    placeholder="Masukkan plat truk, nama driver, atau catatan kondisi barang saat diterima..."
                  />
                )}
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
