import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  VStack, HStack, Button, Selector,
  Table, Text, Divider, Heading, Card,
} from "@astryxdesign/core";
import { DateInput } from "@astryxdesign/core/DateInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { purchaseOrderRepo, vendorRepo, type Vendor } from "@/db/repositories";
import { getDashboardBOMReport, type DashboardBOMReportItem } from "@/db/services";
import { formatRupiah, todayISO } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";

interface POFormProps {
  initialEditId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function POForm({ initialEditId, onSuccess, onCancel }: POFormProps) {
  const isEdit = !!initialEditId;
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bomData, setBomData] = useState<DashboardBOMReportItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm({
    defaultValues: {
      poDate: todayISO(),
      items: [] as {
        po_item_id: number;
        item_id: number;
        item_price_id: number;
        qty: number;
        vendor_id: string; // Dari Dropdown
      }[],
    },
    onSubmit: async ({ value }) => {
      setSaving(true);
      try {
        const poData = {
          po_date: value.poDate,
          project_id: selectedProjectId || null,
        };
        const poItems = value.items
          .filter((it) => it.qty > 0 && it.item_id !== 0)
          .map((it) => ({
            po_item_id: it.po_item_id || undefined, // For update
            item_id: it.item_id,
            item_price_id: it.item_price_id,
            vendor_id: it.vendor_id ? Number(it.vendor_id) : null,
            qty: it.qty,
          }));

        if (isEdit) {
          await purchaseOrderRepo.updateWithItems(initialEditId, poData, poItems as any);
        } else {
          await purchaseOrderRepo.createWithItems(poData, poItems as any);
        }
        onSuccess();
      } finally {
        setSaving(false);
      }
    },
  });

  useEffect(() => {
    async function loadData() {
      if (!selectedProjectId) {
        setLoading(false);
        return;
      }

      const [v, bom] = await Promise.all([vendorRepo.findAllSorted(), getDashboardBOMReport(selectedProjectId)]);
      setVendors(v);
      setBomData(bom);

      if (isEdit) {
        const po = await purchaseOrderRepo.findByIdWithSummary(initialEditId);
        const poItems = await purchaseOrderRepo.findItems(initialEditId);
        if (po) {
          form.setFieldValue("poDate", po.po_date);

          form.setFieldValue("items", poItems.map(p => {
            return {
              po_item_id: p.po_item_id,
              item_id: p.item_id || 0,
              item_price_id: p.item_price_id || 0,
              qty: p.qty,
              vendor_id: p.vendor_id ? String(p.vendor_id) : "",
            };
          }));
        }
      } else {
        // Form kosong, user tambah manual
        form.setFieldValue("items", []);
      }
      setLoading(false);
    }
    loadData();
  }, [isEdit, initialEditId, form, selectedProjectId]);

  if (loading) return <VStack padding={4}><Text>Memuat data...</Text></VStack>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
      <form.Subscribe
        selector={(state) => [state.values.items] as const}
      >
        {([items]) => {
          const bomOptions = bomData;

          // Resolve full item objects for rendering
          const resolvedItems = items.map(it => {
            const b = bomData.find(bom => bom.item_id === it.item_id);
            return {
              ...it,
              item_name: b?.item_name || "",
              unit: b?.unit || "",
              price: b?.price || 0,
              planned_volume: b?.planned_volume || 0,
              total_ordered: b?.total_ordered || 0,
            };
          });

          const total = resolvedItems.reduce((sum, it) => sum + (it.qty * it.price), 0);
          const hasOrderedItems = items.some(it => it.qty > 0 && it.vendor_id !== "" && it.item_id !== 0);
          const isValid = hasOrderedItems;

          return (
            <VStack gap={6}>
              <Card padding={4}>
                <HStack gap={4} style={{ alignItems: 'flex-start' }}>
                  <div style={{ width: 240 }}>
                      <form.Field name="poDate">
                        {(field) => (
                          <DateInput label="Tanggal PO" value={field.state.value as any} onChange={(v) => field.handleChange(v || "")} isRequired />
                        )}
                      </form.Field>
                  </div>
                </HStack>
              </Card>

              <Card padding={4}>
                <VStack gap={4}>
                  <HStack justify="between" align="center">
                    <Heading level={4}>Daftar Kebutuhan BOM</Heading>
                  </HStack>

                  <Text color="secondary" size="sm">Pilih material dari daftar BOM dan isi volume yang dipesan.</Text>

                  <Table
                    columns={[
                      {
                        key: "item", header: "Barang / Material / Jasa", width: proportional(2),
                        renderCell: (row: any) => {
                          const idx = resolvedItems.indexOf(row);
                          return (
                            <form.Field name={`items[${idx}].item_id`}>
                              {(field) => (
                                <Selector
                                  label="Barang"
                                  isLabelHidden
                                  options={[
                                    { value: "0", label: "Pilih Material..." },
                                    ...bomOptions.map(b => ({ value: String(b.item_id), label: `${b.item_name} (${b.unit})` }))
                                  ]}
                                  value={String(field.state.value)}
                                  onChange={(v) => {
                                    const id = Number(v);
                                    field.handleChange(id);
                                    const bom = bomData.find(b => b.item_id === id);
                                    if (bom) {
                                      form.setFieldValue(`items[${idx}].item_price_id`, bom.item_price_id);
                                    }
                                  }}
                                />
                              )}
                            </form.Field>
                          )
                        }
                      },
                      {
                        key: "bom", header: "BOM (Sisa / Rencana)", width: pixel(180),
                        renderCell: (row: any) => {
                          if (!row.item_id) return null;
                          let sisa = row.planned_volume - row.total_ordered;
                          if (isEdit && row.po_item_id) {
                            sisa += row.qty;
                          }
                          sisa = Math.max(0, sisa);
                          return (
                            <VStack gap={0.5}>
                              <Text size="sm">{sisa} {row.unit} (Sisa)</Text>
                              <Text size="sm" color="secondary">Rencana: {row.planned_volume} {row.unit}</Text>
                            </VStack>
                          );
                        }
                      },
                      {
                        key: "vendor", header: "Vendor Pemasok", width: proportional(1.5),
                        renderCell: (row: any) => {
                          const idx = resolvedItems.indexOf(row);
                          return (
                            <form.Field name={`items[${idx}].vendor_id`}>
                              {(field) => (
                                <Selector
                                  isLabelHidden
                                  label="Vendor"
                                  options={[{ value: "", label: "Pilih vendor..." }, ...vendors.map(v => ({ value: String(v.vendor_id), label: v.vendor_name }))]}
                                  value={field.state.value}
                                  onChange={(v) => field.handleChange(v as string)}
                                />
                              )}
                            </form.Field>
                          )
                        }
                      },
                      {
                        key: "qty", header: "Volume Dipesan", width: pixel(130),
                        renderCell: (row: any) => {
                          const idx = resolvedItems.indexOf(row);
                          return (
                            <form.Field name={`items[${idx}].qty`}>
                              {(field) => <NumberInput label="Volume" isLabelHidden value={field.state.value} onChange={(v) => field.handleChange(v)} />}
                            </form.Field>
                          )
                        }
                      },
                      {
                        key: "price", header: "Harga Satuan (Rp)", width: pixel(150),
                        renderCell: (row: any) => row.item_id ? <Text size="sm">{formatRupiah(row.price)}</Text> : null
                      },
                      {
                        key: "subtotal_item", header: "Subtotal", width: pixel(140),
                        renderCell: (row: any) => row.item_id ? <Text size="sm">{formatRupiah(row.qty * row.price)}</Text> : null
                      },
                      {
                        key: "remove", header: "", width: pixel(50),
                        renderCell: (row: any) => {
                          const idx = resolvedItems.indexOf(row);
                          return (
                            <form.Field name="items">
                              {(field) => (
                                <Button size="sm" variant="ghost" label="✕" type="button" onClick={() => field.removeValue(idx)} />
                              )}
                            </form.Field>
                          )
                        }
                      }
                    ]}
                    data={resolvedItems as any}
                  />

                  <form.Field name="items">
                    {(field) => (
                      <Button size="sm" variant="secondary" label="+ Tambah Item" type="button" onClick={() => field.pushValue({ po_item_id: 0, item_id: 0, item_price_id: 0, qty: 0, vendor_id: "" })} />
                    )}
                  </form.Field>

                  <Divider />
                  <HStack gap={4} justify="end">
                    <VStack gap={1} align="end">
                      <HStack gap={6}><Text weight="semibold">Estimasi Total Biaya</Text><Heading level={2}>{formatRupiah(total)}</Heading></HStack>
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
