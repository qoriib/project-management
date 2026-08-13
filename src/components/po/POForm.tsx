import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  VStack, HStack, Button, TextInput, Selector,
  Table, Text, Divider, Heading, Card,
} from "@astryxdesign/core";
import { proportional, pixel } from "@astryxdesign/core/Table";
import { createPO, updatePO, getPOById, getPOItems } from "@/db/queries/po";
import { getVendors, type Vendor } from "@/db/queries/master";
import { getDashboardBOMReport, type DashboardBOMReportItem } from "@/db/queries/dashboard";
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
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "needed" | "ordered">("all");

  const form = useForm({
    defaultValues: {
      poDate: todayISO(),
      items: [] as {
        po_item_id: number;
        item_id: number;
        item_price_id: number;
        item_name: string;
        unit: string;
        qty: number;
        price: number;
        vendor_id: string; // Dari Dropdown
        planned_volume: number;
        total_ordered: number;
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
          .filter((it) => it.qty > 0)
          .map((it) => ({
            po_item_id: it.po_item_id || undefined, // For update
            item_id: it.item_id,
            item_price_id: it.item_price_id,
            vendor_id: it.vendor_id ? Number(it.vendor_id) : null,
            qty: it.qty,
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
      if (!selectedProjectId) {
        setLoading(false);
        return;
      }

      const [v, bom] = await Promise.all([getVendors(), getDashboardBOMReport(selectedProjectId)]);
      setVendors(v);

      if (isEdit) {
        const po = await getPOById(initialEditId);
        const poItems = await getPOItems(initialEditId);
        if (po) {
          form.setFieldValue("poDate", po.po_date);
          
          form.setFieldValue("items", bom.map(b => {
            const existing = poItems.find(p => p.item_id === b.item_id);
            return {
              po_item_id: existing?.po_item_id || 0,
              item_id: b.item_id,
              item_price_id: b.item_price_id,
              item_name: b.item_name,
              unit: b.unit,
              qty: existing?.qty || 0,
              price: b.price,
              vendor_id: existing?.vendor_id ? String(existing.vendor_id) : "",
              planned_volume: b.planned_volume,
              total_ordered: b.total_ordered, 
            };
          }));
        }
      } else {
        form.setFieldValue("items", bom.map(b => ({
          po_item_id: 0,
          item_id: b.item_id,
          item_price_id: b.item_price_id,
          item_name: b.item_name,
          unit: b.unit,
          qty: 0,
          price: b.price,
          vendor_id: "",
          planned_volume: b.planned_volume,
          total_ordered: b.total_ordered,
        })));
      }
      setLoading(false);
    }
    loadData();
  }, [isEdit, initialEditId, form, selectedProjectId]);

  if (loading) return <VStack padding={4}><Text>Memuat data...</Text></VStack>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
      <form.Subscribe
        selector={(state) => [state.values.items, state.values.poDate] as const}
      >
        {([items, poDate]) => {
          const total = items.reduce((sum, it) => sum + (it.qty * it.price), 0);
          const hasOrderedItems = items.some(it => it.qty > 0 && it.vendor_id !== "");
          const isValid = hasOrderedItems;

          const filteredItems = items.filter(it => {
            if (searchQuery && !it.item_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            
            let sisa = it.planned_volume - it.total_ordered;
            if (isEdit && it.po_item_id) sisa += it.qty; // original ordered amount
            
            if (filterMode === "needed" && sisa <= 0) return false;
            if (filterMode === "ordered" && it.qty <= 0) return false;
            
            return true;
          });

          return (
            <VStack gap={6}>
              <Card padding={4}>
                <VStack gap={3}>
                  <Heading level={4}>Informasi PO</Heading>
                  <HStack gap={4} style={{ alignItems: 'flex-start' }}>
                    <div style={{ width: 240 }}>
                      <form.Field name="poDate">
                        {(field) => (
                          <TextInput label="Tanggal PO" type="date" value={field.state.value} onChange={(e) => field.handleChange(e)} isRequired />
                        )}
                      </form.Field>
                    </div>
                  </HStack>
                </VStack>
              </Card>

              <Card padding={4}>
                <VStack gap={4}>
                  <HStack justify="space-between" align="center">
                     <Heading level={4}>Daftar Kebutuhan BOM</Heading>
                     <HStack gap={2}>
                        <TextInput 
                          label="Cari..."
                          isLabelHidden
                          placeholder="Cari material..." 
                          value={searchQuery}
                          onChange={setSearchQuery}
                        />
                        <Selector
                          label="Filter Status"
                          isLabelHidden
                          options={[
                            { label: "Semua", value: "all" },
                            { label: "Yang Dibutuhkan Saja", value: "needed" },
                            { label: "Volume Tidak Nol", value: "ordered" },
                          ]}
                          value={filterMode}
                          onChange={(v) => setFilterMode(v as any)}
                        />
                     </HStack>
                  </HStack>

                  <Text color="secondary" size="sm">Isi jumlah pemesanan pada kolom "Volume Dipesan". Barang dengan nilai 0 akan diabaikan.</Text>

                  <Table
                    columns={[
                      {
                        key: "item", header: "Barang / Material / Jasa", width: proportional(2),
                        renderCell: (row: any) => <Text weight="medium">{row.item_name}</Text>
                      },
                      {
                        key: "bom", header: "BOM (Sisa / Rencana)", width: pixel(180),
                        renderCell: (row: any) => {
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
                          const idx = items.indexOf(row);
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
                        )}
                      },
                      {
                        key: "qty", header: "Volume Dipesan", width: pixel(130),
                        renderCell: (row: any) => {
                          const idx = items.indexOf(row);
                          return (
                          <form.Field name={`items[${idx}].qty`}>
                            {(field) => <TextInput label="Volume" isLabelHidden value={String(field.state.value)} onChange={(v) => field.handleChange(parseFloat(v) || 0)} />}
                          </form.Field>
                        )}
                      },
                      {
                        key: "price", header: "Harga Satuan (Rp)", width: pixel(150),
                        renderCell: (row: any) => <Text size="sm">{formatRupiah(row.price)}</Text>
                      },
                      {
                        key: "subtotal_item", header: "Subtotal", width: pixel(140),
                        renderCell: (row: any) => <Text size="sm">{formatRupiah(row.qty * row.price)}</Text>
                      }
                    ]}
                    data={filteredItems as any}
                  />
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
