import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  VStack, HStack, Button, TextInput, Selector, TextArea,
  Table, Text, Divider, Heading, Card,
} from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { createPO, updatePO, getPOById, getPOItems } from "@/db/queries/po";
import { getVendors, getItems, type Vendor, type Item as CatalogItem } from "@/db/queries/master";
import { formatRupiah, todayISO } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";

function generatePONumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `PO-${y}${m}${day}-${r}`;
}

interface POFormProps {
  initialEditId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function POForm({ initialEditId, onSuccess, onCancel }: POFormProps) {
  const isEdit = !!initialEditId;
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const form = useForm({
    defaultValues: {
      poNumber: isEdit ? "" : generatePONumber(),
      poDate: todayISO(),
      vendorId: "",
      ppn: false,
      notes: "",
      items: [
        { po_item_id: 0, item_id: 0, item_name: "", unit: "m3", ordered_volume: 0, unit_price: 0 }
      ],
    },
    onSubmit: async ({ value }) => {
      setSaving(true);
      try {
        const poData = {
          po_number: value.poNumber,
          po_date: value.poDate,
          vendor_id: Number(value.vendorId),
          project_id: selectedProjectId || null,
          notes: value.notes,
        };
        const poItems = value.items
          .filter((it) => it.item_id > 0)
          .map((it) => ({
            po_item_id: it.po_item_id || undefined, // For update
            item_id: it.item_id,
            ordered_volume: it.ordered_volume,
            unit_price: it.unit_price,
            ppn_percentage: value.ppn ? 12 : 0,
          }));

        if (isEdit) {
          await updatePO(initialEditId, poData, poItems as any);
        } else {
          await createPO(poData, poItems as any);
        }
        onSuccess();
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    async function loadData() {
      const [v, m] = await Promise.all([getVendors(), getItems()]);
      setVendors(v);
      setCatalogItems(m);

      if (isEdit) {
        const po = await getPOById(initialEditId);
        const poItems = await getPOItems(initialEditId);
        if (po) {
          form.setFieldValue("poNumber", po.po_number);
          form.setFieldValue("poDate", po.po_date);
          form.setFieldValue("vendorId", String(po.vendor_id));
          form.setFieldValue("notes", po.notes || "");
          const hasPpn = poItems.some((i) => (i.ppn_percentage || 0) > 0);
          form.setFieldValue("ppn", hasPpn);
          
          if (poItems.length > 0) {
            form.setFieldValue("items", poItems.map(i => ({
              po_item_id: i.po_item_id,
              item_id: i.item_id || 0,
              item_name: i.item_name || "",
              unit: i.unit || "",
              ordered_volume: i.ordered_volume,
              unit_price: i.unit_price,
            })));
          }
        }
        setLoading(false);
      }
    }
    loadData();
  }, [isEdit, initialEditId, form]);

  if (loading) return <VStack padding={4}><Text>Memuat data...</Text></VStack>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
      <form.Subscribe
        selector={(state) => [state.values.items, state.values.ppn, state.values.poNumber, state.values.vendorId] as const}
      >
        {([items, ppn, poNumber, vendorId]) => {
          const subtotal = items.reduce((sum, it) => sum + (it.ordered_volume * it.unit_price), 0);
          const ppnAmount = ppn ? subtotal * 0.12 : 0;
          const total = subtotal + ppnAmount;
          const isValid = poNumber !== "" && vendorId !== "";

          return (
            <VStack gap={6}>
              <Card padding={4}>
                <VStack gap={3}>
                  <Heading level={4}>Informasi PO</Heading>
                  <HStack gap={4} style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <form.Field name="poNumber">
                        {(field) => (
                          <TextInput label="Nomor PO" value={field.state.value} onChange={(e) => field.handleChange(e)} isDisabled isRequired />
                        )}
                      </form.Field>
                    </div>
                    <div style={{ flex: 1 }}>
                      <form.Field name="poDate">
                        {(field) => (
                          <TextInput label="Tanggal PO" type="date" value={field.state.value} onChange={(e) => field.handleChange(e)} isRequired />
                        )}
                      </form.Field>
                    </div>
                    <div style={{ flex: 2 }}>
                      <form.Field name="vendorId">
                        {(field) => (
                          <Selector
                            label="Vendor Pemasok"
                            value={field.state.value}
                            onChange={(v) => field.handleChange(v as string)}
                            isRequired
                            options={[{ value: "", label: "Pilih vendor..." }, ...vendors.map((v) => ({ value: String(v.vendor_id), label: v.vendor_name }))]}
                          />
                        )}
                      </form.Field>
                    </div>
                  </HStack>
                  <HStack gap={2} align="center">
                    <form.Field name="ppn">
                      {(field) => (
                        <input type="checkbox" checked={field.state.value} onChange={(e) => field.handleChange(e.target.checked)} />
                      )}
                    </form.Field>
                    <Text>Tambahkan PPN 12% untuk semua item</Text>
                  </HStack>
                  <form.Field name="notes">
                    {(field) => (
                      <TextArea label="Catatan / Syarat Pengiriman" value={field.state.value} onChange={(e) => field.handleChange(e)} />
                    )}
                  </form.Field>
                </VStack>
              </Card>

              <Card padding={4}>
                <VStack gap={3}>
                  <HStack gap={2} align="center">
                    <Heading level={4}>Daftar Item Barang / Alat</Heading>
                    <form.Field name="items">
                      {(field) => (
                        <Button size="sm" variant="secondary" label="+ Tambah Item" type="button" onClick={() => field.pushValue({ po_item_id: 0, item_id: 0, item_name: "", unit: "m3", ordered_volume: 0, unit_price: 0 })} />
                      )}
                    </form.Field>
                  </HStack>

                  <Table
                    columns={[
                      {
                        key: "item", header: "Barang / Material / Jasa Sewa", width: proportional(1.5),
                        renderCell: (row: any) => {
                          const idx = items.indexOf(row);
                          return (
                          <form.Field name={`items[${idx}].item_id`}>
                            {(field) => (
                              <Selector
                                label="Pilih Katalog"
                                isLabelHidden
                                value={String(field.state.value)}
                                onChange={(v) => {
                                  field.handleChange(Number(v));
                                  const mat = catalogItems.find(m => m.item_id === Number(v));
                                  form.setFieldValue(`items[${idx}].item_name`, mat?.item_name ?? "");
                                  form.setFieldValue(`items[${idx}].unit`, mat?.unit ?? "m3");
                                }}
                                options={[{ value: "0", label: "Pilih katalog..." }, ...catalogItems.map((m) => ({ value: String(m.item_id), label: `${m.item_name} (${m.unit})` }))]}
                              />
                            )}
                          </form.Field>
                        )}
                      },
                      {
                        key: "unit", header: "Satuan", width: pixel(90),
                        renderCell: (row: any) => {
                          const idx = items.indexOf(row);
                          return (
                          <form.Field name={`items[${idx}].unit`}>
                            {(field) => <Text size="sm">{field.state.value}</Text>}
                          </form.Field>
                        )}
                      },
                      {
                        key: "ordered_volume", header: "Volume Dipesan", width: pixel(115),
                        renderCell: (row: any) => {
                          const idx = items.indexOf(row);
                          return (
                          <form.Field name={`items[${idx}].ordered_volume`}>
                            {(field) => <TextInput label="" value={String(field.state.value)} onChange={(v) => field.handleChange(parseFloat(v) || 0)} />}
                          </form.Field>
                        )}
                      },
                      {
                        key: "unit_price", header: "Harga Satuan (Rp)", width: pixel(165),
                        renderCell: (row: any) => {
                          const idx = items.indexOf(row);
                          return (
                          <form.Field name={`items[${idx}].unit_price`}>
                            {(field) => <TextInput label="" value={String(field.state.value)} onChange={(v) => field.handleChange(parseFloat(v) || 0)} />}
                          </form.Field>
                        )}
                      },
                      {
                        key: "subtotal_item", header: "Subtotal", width: pixel(140),
                        renderCell: (row) => <Text size="sm">{formatRupiah(row.ordered_volume * row.unit_price)}</Text>
                      },
                      {
                        key: "remove", header: "", width: pixel(50),
                        renderCell: (row: any) => {
                          const idx = items.indexOf(row);
                          return (
                          <form.Field name="items">
                            {(field) => (
                              <Button size="sm" variant="ghost" label="✕" type="button" isDisabled={field.state.value.length === 1} onClick={() => field.removeValue(idx)} />
                            )}
                          </form.Field>
                        )}
                      }
                    ]}
                    data={items as any}
                  />
                  <Divider />
                  <HStack gap={4} justify="end">
                    <VStack gap={1} align="end">
                      <HStack gap={6}><Text color="secondary">Subtotal</Text><Text weight="medium">{formatRupiah(subtotal)}</Text></HStack>
                      {ppn && <HStack gap={6}><Text color="secondary">PPN 12%</Text><Text weight="medium">{formatRupiah(ppnAmount)}</Text></HStack>}
                      <HStack gap={6}><Text weight="semibold">Total</Text><Heading level={2}>{formatRupiah(total)}</Heading></HStack>
                    </VStack>
                  </HStack>
                </VStack>
              </Card>

              <HStack gap={2} justify="end">
                <Button variant="ghost" label="Batal" type="button" onClick={onCancel} />
                <Button variant="primary" label="Simpan PO" type="submit" isLoading={saving} isDisabled={!isValid} />
              </HStack>
            </VStack>
          );
        }}
      </form.Subscribe>
    </form>
  );
}
