import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { VStack, HStack, Button, Text, Divider, Heading, Card, Table, Selector, IconButton } from "@astryxdesign/core";
import { Banner } from "@astryxdesign/core/Banner";
import { DateInput } from "@astryxdesign/core/DateInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { proportional, pixel, type TableColumn } from "@astryxdesign/core/Table";
import { useToast } from "@astryxdesign/core/Toast";
import { itemPriceRepo, type ItemPrice, type POItemInput } from "@/db/repositories";
import { getDashboardBOMReport, type DashboardBOMReportItem } from "@/db/services";
import { formatNumber, formatRupiah, todayISO } from "@/utils/formatters";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { usePOStore } from "@/store/usePOStore";
import { getFieldError } from "@/utils/form";
import { X } from "lucide-react";
import * as v from "valibot";

const poSchema = v.object({
  poDate: v.pipe(v.string(), v.nonEmpty("Tanggal PO harus diisi.")),
  items: v.pipe(
    v.array(
      v.object({
        po_item_id: v.number(),
        item_id: v.pipe(v.number(), v.minValue(1, "Material harus dipilih.")),
        vendor_id: v.pipe(v.string(), v.nonEmpty("Vendor harus dipilih.")),
        item_price_id: v.pipe(v.string(), v.nonEmpty("Pilih variasi harga.")),
        qty: v.pipe(v.number(), v.minValue(0.001, "Volume tidak valid.")),
      })
    ),
    v.minLength(1, "Minimal harus ada 1 item yang dipesan.")
  )
});

export type POItemRow = {
  po_item_id: number;
  item_id: number;
  vendor_id: string;
  item_price_id: string;
  qty: number;
  item_name: string;
  unit: string;
  price: number;
  planned_volume: number;
  total_ordered: number;
  original_qty: number;
  sisaAwal: number;
} & Record<string, unknown>;

interface POFormProps {
  initialEditId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function POForm({ initialEditId, onSuccess, onCancel }: POFormProps) {
  const showToast = useToast();

  const isEdit = !!initialEditId;
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const { vendors } = useMasterStore();
  const { createPO, updatePO, loadPODetail } = usePOStore();
  const [bomData, setBomData] = useState<DashboardBOMReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceCache, setPriceCache] = useState<Map<number, ItemPrice[]>>(new Map());

  const form = useForm({
    defaultValues: {
      poDate: todayISO(),
      items: [] as {
        po_item_id: number;
        item_id: number;
        vendor_id: string;
        item_price_id: string;
        qty: number;
        original_qty?: number;
      }[],
    },
    validators: {
      onChange: poSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const poData = {
          po_date: value.poDate,
          project_id: selectedProjectId!,
        };

        const poItems: POItemInput[] = value.items.map((it) => ({
          po_item_id: it.po_item_id || undefined,
          item_id: it.item_id,
          vendor_id: Number(it.vendor_id),
          item_price_id: Number(it.item_price_id),
          qty: it.qty,
        }));

        if (isEdit) {
          await updatePO(initialEditId, poData, poItems);
          showToast({ body: "PO berhasil diperbarui", type: "info" });
        } else {
          await createPO(poData, poItems);
          showToast({ body: "PO berhasil dibuat", type: "info" });
        }
        onSuccess();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
        showToast({ body: msg, type: "error" });
      }
    },
  });

  /** Load and cache price variants for an item */
  async function getPricesForItem(itemId: number): Promise<ItemPrice[]> {
    if (priceCache.has(itemId)) return priceCache.get(itemId)!;
    const prices = await itemPriceRepo.findByItem(itemId);
    setPriceCache(prev => new Map(prev).set(itemId, prices));
    return prices;
  }

  useEffect(() => {
    async function loadData() {
      if (!selectedProjectId) {
        setLoading(false);
        return;
      }

      const bom = await getDashboardBOMReport(selectedProjectId);

      setBomData(bom);

      if (isEdit) {
        await loadPODetail(initialEditId);
        const { currentPO: po, currentItems: poItems } = usePOStore.getState();
        if (po) {
          // Pre-load price variants for all items
          const allItemIds = [...new Set(poItems.map(p => p.item_id).filter(Boolean) as number[])];
          const cache = new Map<number, ItemPrice[]>();

          await Promise.all(allItemIds.map(async id => {
            const prices = await itemPriceRepo.findByItem(id);
            cache.set(id, prices);
          }));

          setPriceCache(cache);

          form.reset({
            poDate: po.po_date,
            items: poItems.map(p => ({
              po_item_id: p.po_item_id,
              item_id: p.item_id || 0,
              vendor_id: String(p.vendor_id || ""),
              item_price_id: String(p.item_price_id || ""),
              qty: p.qty,
              original_qty: p.qty,
            }))
          });
        }
      } else {
        form.reset({
          poDate: todayISO(),
          items: []
        });
      }
      setLoading(false);
    }
    loadData();
  }, [isEdit, initialEditId, selectedProjectId]); // removed form from dep array as it is stable

  if (loading) return <VStack padding={4}><Text>Memuat data...</Text></VStack>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
      <form.Subscribe
        selector={(state) => [state.values.items, state.canSubmit, state.isSubmitting, state.errors] as const}
      >
        {([items, canSubmit, isSubmitting]) => {
          const bomOptions = Array.from(new Map(bomData.map(b => [b.item_id, b])).values());
          const selectedItemIds = new Set(items.map(it => it.item_id).filter(id => id > 0));

          // Resolve full item objects for rendering
          const resolvedItems = items.map(it => {
            const b = bomOptions.find(bom => bom.item_id === it.item_id);
            const prices = priceCache.get(it.item_id) ?? [];
            const selectedPrice = prices.find(p => String(p.item_price_id) === it.item_price_id);

            let planned_volume = 0;
            let total_ordered = 0;

            if (it.item_price_id) {
              const matchingVariants = bomData.filter(bom => bom.item_id === it.item_id && String(bom.item_price_id) === it.item_price_id);
              planned_volume = matchingVariants.reduce((sum, v) => sum + v.planned_volume, 0);
              total_ordered = matchingVariants.reduce((sum, v) => sum + v.total_ordered, 0);
            } else {
              const allVariants = bomData.filter(bom => bom.item_id === it.item_id);
              planned_volume = allVariants.reduce((sum, v) => sum + v.planned_volume, 0);
              total_ordered = allVariants.reduce((sum, v) => sum + v.total_ordered, 0);
            }

            const original_qty = it.original_qty || 0;
            const sisaAwal = planned_volume - total_ordered + original_qty;

            return {
              ...it,
              item_name: b?.item_name || "",
              unit: b?.unit || "",
              price: selectedPrice?.price ?? 0,
              planned_volume,
              total_ordered,
              original_qty,
              sisaAwal,
            };
          });

          const total = resolvedItems.reduce((sum, it) => sum + (it.qty * it.price), 0);

          const columns: TableColumn<POItemRow>[] = [
            {
              key: "item",
              header: "Item",
              width: proportional(1),
              renderCell: (row: POItemRow) => {
                const idx = resolvedItems.indexOf(row);
                return (
                  <form.Field name={`items[${idx}].item_id`}>
                    {(field) => {
                      const currentVal = Number(field.state.value);
                      return (
                      <Selector
                        label="Barang"
                        isLabelHidden
                        options={[
                          { value: "0", label: "Pilih Material..." },
                          ...bomOptions
                            .filter((b) => b.item_id === currentVal || !selectedItemIds.has(b.item_id))
                            .map((b) => ({
                              value: String(b.item_id),
                              label: `${b.item_name} (${b.unit})`,
                            })),
                        ]}
                        value={String(field.state.value)}
                        onChange={async (v: string) => {
                          const id = Number(v);
                          field.handleChange(id);
                          if (id) {
                            await getPricesForItem(id);
                            const bomItem = bomOptions.find((b) => b.item_id === id);
                            if (bomItem && bomItem.item_price_id) {
                              form.setFieldValue(
                                `items[${idx}].item_price_id`,
                                String(bomItem.item_price_id)
                              );
                            } else {
                              form.setFieldValue(`items[${idx}].item_price_id`, "");
                            }
                          } else {
                            form.setFieldValue(`items[${idx}].item_price_id`, "");
                          }
                        }}
                        onBlur={field.handleBlur}
                        statusVariant="attached"
                        status={getFieldError(
                          field.state.meta.errors,
                          !!field.state.meta.isTouched
                        )}
                      />
                      );
                    }}
                  </form.Field>
                );
              },
            },
            {
              key: "bom",
              header: "BOM (Sisa / Rencana)",
              width: pixel(180),
              renderCell: (row: POItemRow) => {
                if (!row.item_id) return null;
                const sisaAkhir = row.sisaAwal - row.qty;

                return (
                  <VStack gap={0.5}>
                    <Text size="sm" weight="medium">
                      {formatNumber(sisaAkhir, 2)} {row.unit} (Sisa)
                    </Text>
                    <Text size="sm" color="secondary">
                      Rencana: {row.planned_volume} {row.unit}
                    </Text>
                  </VStack>
                );
              },
            },
            {
              key: "price",
              header: "Variasi Harga",
              width: pixel(180),
              renderCell: (row: POItemRow) => {
                const idx = resolvedItems.indexOf(row);
                const itemId = row.item_id;
                const prices = itemId ? priceCache.get(itemId) ?? [] : [];
                return (
                  <form.Field name={`items[${idx}].item_price_id`}>
                    {(field) => (
                      <Selector
                        label="Harga"
                        isLabelHidden
                        options={[
                          {
                            value: "",
                            label: itemId
                              ? prices.length === 0
                                ? "Belum ada harga"
                                : "Pilih harga..."
                              : "Pilih item dahulu...",
                          },
                          ...prices.map((p) => ({
                            value: String(p.item_price_id),
                            label: formatRupiah(p.price),
                          })),
                        ]}
                        value={field.state.value}
                        onChange={(v: string) => field.handleChange(v)}
                        onBlur={field.handleBlur}
                        statusVariant="attached"
                        status={getFieldError(
                          field.state.meta.errors,
                          !!field.state.meta.isTouched
                        )}
                        isDisabled={!itemId || prices.length === 0}
                      />
                    )}
                  </form.Field>
                );
              },
            },
            {
              key: "vendor",
              header: "Vendor Pemasok",
              width: pixel(280),
              renderCell: (row: POItemRow) => {
                const idx = resolvedItems.indexOf(row);
                return (
                  <form.Field name={`items[${idx}].vendor_id`}>
                    {(field) => (
                      <Selector
                        label="Vendor"
                        isLabelHidden
                        options={[
                          { value: "", label: "Pilih vendor..." },
                          ...vendors.map((v) => ({
                            value: String(v.vendor_id),
                            label: v.vendor_name,
                          })),
                        ]}
                        value={field.state.value}
                        onChange={(v: string) => field.handleChange(v)}
                        onBlur={field.handleBlur}
                        statusVariant="attached"
                        status={getFieldError(
                          field.state.meta.errors,
                          !!field.state.meta.isTouched
                        )}
                      />
                    )}
                  </form.Field>
                );
              },
            },
            {
              key: "qty",
              header: "Volume Dipesan",
              width: pixel(160),
              renderCell: (row: POItemRow) => {
                const idx = resolvedItems.indexOf(row);
                return (
                  <form.Field
                    name={`items[${idx}].qty`}
                    validators={{
                      onChange: ({ value }: { value: number }) =>
                        value > row.sisaAwal
                          ? `Melebihi sisa BOM (${formatNumber(row.sisaAwal, 2)}).`
                          : undefined,
                    }}
                  >
                    {(field) => (
                      <NumberInput
                        label="Volume"
                        isLabelHidden
                        value={field.state.value}
                        onChange={(v) => field.handleChange(v || 0)}
                        onBlur={field.handleBlur}
                        statusVariant="attached"
                        status={getFieldError(
                          field.state.meta.errors,
                          !!field.state.meta.isTouched
                        )}
                      />
                    )}
                  </form.Field>
                );
              },
            },
            {
              key: "subtotal_item",
              header: "Subtotal",
              width: pixel(180),
              renderCell: (row: POItemRow) =>
                row.item_id ? (
                  <Text size="sm">{formatRupiah(row.qty * row.price)}</Text>
                ) : null,
            },
            {
              key: "remove",
              header: "",
              width: pixel(80),
              renderCell: (row: POItemRow) => {
                const idx = resolvedItems.indexOf(row);
                return (
                  <HStack justify="end">
                    <form.Field name="items">
                      {(field) => (
                        <IconButton
                          icon={<X size={16} />}
                          size="sm"
                          variant="secondary"
                          type="button"
                          label="Hapus Item"
                          onClick={() => field.removeValue(idx)}
                        />
                      )}
                    </form.Field>
                  </HStack>
                );
              },
            },
          ];

          return (
            <VStack gap={4}>
              <Card padding={4}>
                <VStack width={320}>
                  <form.Field name="poDate">
                    {(field) => {
                      type ISODate = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;
                      return (
                        <DateInput
                          label="Tanggal PO"
                          value={field.state.value as ISODate}
                          onChange={(v) => field.handleChange(v || "")}
                          onBlur={field.handleBlur}
                          statusVariant="attached"
                          status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                          isRequired
                        />
                      )
                    }}
                  </form.Field>
                </VStack>
              </Card>
              <Card padding={4}>
                <VStack gap={4}>
                  <HStack justify="between" align="center">
                    <Heading level={3}>Daftar Item PO</Heading>
                    <form.Field name="items">
                      {(field) => (
                        <Button
                          variant="secondary"
                          label="Tambah Item"
                          type="button"
                          onClick={() => field.pushValue({
                            po_item_id: 0,
                            item_id: 0,
                            vendor_id: "",
                            item_price_id: "",
                            qty: 0,
                            original_qty: 0
                          })} />
                      )}
                    </form.Field>
                  </HStack>
                  <Table verticalAlign="top" columns={columns} data={resolvedItems} />
                  <Divider />
                  <HStack justify="end" align="center" gap={6}>
                    <Text weight="semibold">Estimasi Total Biaya</Text>
                    <Heading level={2}>{formatRupiah(total)}</Heading>
                  </HStack>
                </VStack>
              </Card>
              <form.Field name="items">
                {(field) => field.state.meta.errors.length > 0 && (
                  <Banner
                    status="error"
                    title={typeof field.state.meta.errors[0] === 'string' ? field.state.meta.errors[0] : field.state.meta.errors[0]?.message}
                  />
                )}
              </form.Field>
              <HStack gap={2} justify="end">
                <Button
                  variant="secondary"
                  label="Batal"
                  type="button"
                  onClick={onCancel}
                />
                <Button
                  variant="primary"
                  label="Simpan"
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
