import { useEffect, useState } from "react";
import { VStack, HStack, Button, Selector } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { useToast } from "@astryxdesign/core/Toast";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import { type BOMDetail } from "@/db/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useBOMStore } from "@/store/useBOMStore";
import { formatRupiah } from "@/utils/formatters";
import * as v from "valibot";

const bomSchema = v.object({
  item_id: v.pipe(v.string(), v.nonEmpty("Material harus dipilih.")),
  qty: v.pipe(v.number(), v.minValue(0.001, "Volume harus lebih dari 0.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Pilih harga terlebih dahulu.")),
});

interface BOMFormProps {
  stageId?: number;
  initialData?: BOMDetail;
  isDisabled?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BOMForm({ stageId, initialData, isDisabled, onSuccess, onCancel }: BOMFormProps) {
  const showToast = useToast();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);

  const { items, itemPricesMap, loadItemPrices } = useMasterStore();
  const { boms: existingBoms, createBOM, updateBOM } = useBOMStore();
  const [priceOptions, setPriceOptions] = useState<{ value: string; label: string }[]>([]);

  const form = useForm({
    defaultValues: {
      item_id: initialData?.item_id ? String(initialData.item_id) : "",
      qty: initialData?.qty ? Number(initialData.qty) : 0,
      item_price_id: initialData?.item_price_id ? String(initialData.item_price_id) : "",
    },
    validators: {
      onChange: bomSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        if (!selectedProjectId || !stageId) return;

        const data = {
          project_id: selectedProjectId,
          item_id: Number(value.item_id),
          stage_id: stageId,
          qty: value.qty,
          item_price_id: Number(value.item_price_id),
        };

        if (initialData) {
          await updateBOM(initialData.bom_id, { qty: data.qty, item_price_id: data.item_price_id });
        } else {
          await createBOM(data);
          form.reset();
          setPriceOptions([]);
        }
        onSuccess();
      } catch (error: any) {
        showToast({ body: error.message || "Terjadi kesalahan", type: "error" });
      }
    }
  });

  async function loadPricesForItem(itemId: string) {
    let prices = itemPricesMap.get(Number(itemId));

    if (!prices) {
      prices = await loadItemPrices(Number(itemId));
    }

    const usedPricesForItem = existingBoms
      .filter(b => b.item_id === Number(itemId) && (!initialData || b.bom_id !== initialData.bom_id))
      .map(b => b.item_price_id);

    const availablePrices = prices.filter(p => !usedPricesForItem.includes(p.item_price_id));
    const opts = availablePrices.map(p => ({ value: String(p.item_price_id), label: formatRupiah(p.price) }));

    setPriceOptions(opts);
  }

  useEffect(() => {
    if (initialData) {
      form.reset({
        item_id: String(initialData.item_id),
        qty: Number(initialData.qty),
        item_price_id: String(initialData.item_price_id),
      });
      loadPricesForItem(String(initialData.item_id));
    } else {
      form.reset({
        item_id: "",
        qty: 0,
        item_price_id: "",
      });
      setPriceOptions([]);
    }
  }, [initialData, stageId]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
      <form.Subscribe
        selector={(state) => [state.values.item_id, state.canSubmit, state.isSubmitting] as const}
        children={([formItemId, canSubmit, isSubmitting]) => (
          <HStack gap={3} align="start" padding={3}>
            <VStack style={{ flex: 1 }}>
              <form.Field
                name="item_id"
                children={(field) => (
                  <Selector
                    label="Material / Alat"
                    hasSearch
                    value={field.state.value}
                    onChange={(val) => {
                      field.handleChange(val);
                      loadPricesForItem(val);
                    }}
                    onBlur={field.handleBlur}
                    statusVariant="attached"
                    status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                    options={[
                      { value: "", label: "Pilih Material/Alat..." },
                      ...items
                        .filter(i => (initialData?.item_id === i.item_id) || !existingBoms.some(b => b.item_id === i.item_id))
                        .map((i) => ({ value: String(i.item_id), label: `${i.item_name} (${i.unit_name})` })),
                    ]}
                    isDisabled={isDisabled}
                  />
                )}
              />
            </VStack>
            <VStack width={200}>
              <form.Field
                name="qty"
                children={(field) => (
                  <NumberInput
                    label="Volume Rencana"
                    placeholder="Contoh: 1500"
                    value={field.state.value || null}
                    onChange={(val) => field.handleChange(val || 0)}
                    onBlur={field.handleBlur}
                    statusVariant="attached"
                    status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                    isDisabled={isDisabled}
                  />
                )}
              />
            </VStack>
            <VStack width={260}>
              <form.Field
                name="item_price_id"
                children={(field) => (
                  <Selector
                    label="Harga"
                    value={field.state.value}
                    onChange={(val) => field.handleChange(val)}
                    onBlur={field.handleBlur}
                    statusVariant="attached"
                    status={getFieldError(field.state.meta.errors, !!field.state.meta.isTouched)}
                    options={[
                      { value: "", label: priceOptions.length === 0 ? "Pilih item dahulu..." : "Pilih harga..." },
                      ...priceOptions,
                    ]}
                    isDisabled={isDisabled || !formItemId || priceOptions.length === 0}
                  />
                )}
              />
            </VStack>
            <VStack style={{ paddingTop: '24px' }}>
              <HStack gap={2}>
                <Button
                  variant="primary"
                  label={initialData ? "Simpan" : "Tambah"}
                  type="submit"
                  isLoading={isSubmitting}
                  isDisabled={isDisabled || !canSubmit || !selectedProjectId}
                />
                {initialData && <Button variant="secondary" label="Batal" onClick={onCancel} />}
              </HStack>
            </VStack>
          </HStack>
        )}
      />
    </form>
  );
}
