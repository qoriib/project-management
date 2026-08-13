import { useEffect, useState } from "react";
import { VStack, HStack, Button, Selector, Heading, Text } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { useForm } from "@tanstack/react-form";
import { getFieldError } from "@/utils/form";
import * as v from "valibot";
import {
  bomRepo,
  itemPriceRepo,
  type BillOfMaterial,
  type BOMDetail,
} from "@/db/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { formatRupiah } from "@/utils/formatters";

const bomSchema = v.object({
  stage_id: v.pipe(v.string(), v.nonEmpty("Tahap proyek harus dipilih.")),
  item_id: v.pipe(v.string(), v.nonEmpty("Material harus dipilih.")),
  qty: v.pipe(v.number(), v.minValue(0.001, "Volume harus lebih dari 0.")),
  item_price_id: v.pipe(v.string(), v.nonEmpty("Pilih harga terlebih dahulu.")),
});

interface BOMFormProps {
  stageId?: number;
  initialData?: BOMDetail;
  isInline?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BOMForm({ stageId, initialData, isInline, onSuccess, onCancel }: BOMFormProps) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const { items } = useMasterStore();
  const [existingBoms, setExistingBoms] = useState<BillOfMaterial[]>([]);
  const [stages, setStages] = useState<{ value: string; label: string }[]>([]);
  const [priceOptions, setPriceOptions] = useState<{ value: string; label: string }[]>([]);

  const form = useForm({
    defaultValues: {
      stage_id: initialData?.stage_id ? String(initialData.stage_id) : (stageId ? String(stageId) : ""),
      item_id: initialData?.item_id ? String(initialData.item_id) : "",
      qty: initialData?.qty ? Number(initialData.qty) : 0,
      item_price_id: initialData?.item_price_id ? String(initialData.item_price_id) : "",
    },
    validators: {
      onChange: bomSchema,
    },
    onSubmit: async ({ value }) => {
      if (!selectedProjectId) return;

      const data = {
        project_id: selectedProjectId,
        item_id: Number(value.item_id),
        stage_id: Number(value.stage_id),
        qty: value.qty,
        item_price_id: Number(value.item_price_id),
      };

      if (initialData) {
        await bomRepo.update(initialData.bom_id, data);
      } else {
        await bomRepo.create(data);
        if (isInline) {
          form.setFieldValue("item_id", "");
          form.setFieldValue("qty", 0);
          form.setFieldValue("item_price_id", "");
          setPriceOptions([]);
        }
      }
      onSuccess();
    }
  });

  // Load price options when item_id changes
  async function loadPricesForItem(itemId: string) {
    if (!itemId) {
      setPriceOptions([]);
      form.setFieldValue("item_price_id", "");
      return;
    }
    const prices = await itemPriceRepo.findByItem(Number(itemId));
    const opts = prices.map(p => ({ value: String(p.item_price_id), label: formatRupiah(p.price) }));
    setPriceOptions(opts);

    // Auto-select first option if no current selection
    const currentPriceId = form.getFieldValue("item_price_id");
    if (!currentPriceId && prices.length > 0) {
      form.setFieldValue("item_price_id", String(prices[0].item_price_id));
    }
  }

  // Watch for external prop changes
  useEffect(() => {
    if (initialData) {
      form.setFieldValue("stage_id", String(initialData.stage_id));
      form.setFieldValue("item_id", String(initialData.item_id));
      form.setFieldValue("qty", Number(initialData.qty));
      form.setFieldValue("item_price_id", String(initialData.item_price_id));
      loadPricesForItem(String(initialData.item_id));
    } else if (stageId) {
      form.setFieldValue("stage_id", String(stageId));
      form.setFieldValue("item_id", "");
      form.setFieldValue("qty", 0);
      form.setFieldValue("item_price_id", "");
      setPriceOptions([]);
    }
  }, [initialData, stageId]); // intentionally omitting `form`

  useEffect(() => {
    if (selectedProjectId) {
      bomRepo.findStagesByProject(selectedProjectId).then(data => {
        setStages(data.map(d => ({ value: String(d.stage_id), label: d.stage_name })));
      });
    }
  }, [selectedProjectId]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
      <form.Subscribe
        selector={(state) => [state.values.stage_id, state.values.item_id, state.canSubmit, state.isSubmitting] as const}
        children={([formStageId, formItemId, canSubmit, isSubmitting]) => {

          // Fetch existing BOMs for this stage whenever it changes
          useEffect(() => {
            if (selectedProjectId && formStageId) {
              bomRepo.findAllWithDetails({ project_id: selectedProjectId, stage_id: Number(formStageId) }).then(setExistingBoms);
            } else {
              setExistingBoms([]);
            }
          }, [selectedProjectId, formStageId]);

          if (isInline) {
            return (
              <HStack gap={3} align="start" padding={3}>
                <div style={{ flex: 2 }}>
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
                        status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                        options={[
                          { value: "", label: "Pilih Material/Alat..." },
                          ...items
                            .filter(i => (initialData?.item_id === i.item_id) || !existingBoms.some(b => b.item_id === i.item_id))
                            .map((i) => ({ value: String(i.item_id), label: `${i.item_name} (${i.unit_name})` })),
                        ]}
                      />
                    )}
                  />
                </div>
                <div style={{ flex: 1 }}>
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
                        status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                      />
                    )}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <form.Field
                    name="item_price_id"
                    children={(field) => (
                      <Selector
                        label="Harga"
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val)}
                        onBlur={field.handleBlur}
                        statusVariant="attached"
                        status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                        options={[
                          { value: "", label: priceOptions.length === 0 ? "Pilih item dahulu..." : "Pilih harga..." },
                          ...priceOptions,
                        ]}
                        isDisabled={!formItemId || priceOptions.length === 0}
                      />
                    )}
                  />
                </div>
                <div style={{ paddingTop: '28px' }}>
                  <Button
                    variant="primary"
                    label={initialData ? "Simpan Edit" : "Tambah BOM"}
                    type="submit"
                    isLoading={isSubmitting}
                    isDisabled={!canSubmit || !selectedProjectId}
                  />
                  {initialData && <Button variant="ghost" label="Batal" onClick={onCancel} style={{ marginLeft: 8 }} />}
                </div>
              </HStack>
            );
          }

          return (
            <VStack gap={4} padding={4}>
              <Heading level={4}>{initialData ? "Edit Kebutuhan Material" : "Tambah Kebutuhan Material"}</Heading>

              <VStack gap={4} style={{ marginTop: 8 }}>
                {(!stageId || initialData) && (
                  <form.Field
                    name="stage_id"
                    children={(field) => (
                      <Selector
                        label="Tahap Proyek"
                        isRequired
                        value={field.state.value}
                        onChange={(val) => field.handleChange(val)}
                        onBlur={field.handleBlur}
                        statusVariant="attached"
                        status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                        options={[{ value: "", label: "Pilih Tahap..." }, ...stages]}
                      />
                    )}
                  />
                )}

                <form.Field
                  name="item_id"
                  children={(field) => (
                    <Selector
                      label="Material / Alat"
                      isRequired
                      hasSearch
                      value={field.state.value}
                      onChange={(val) => {
                        field.handleChange(val);
                        loadPricesForItem(val);
                      }}
                      onBlur={field.handleBlur}
                      statusVariant="attached"
                      status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                      options={[
                        { value: "", label: "Pilih Material/Alat..." },
                        ...items
                          .filter(i => (initialData?.item_id === i.item_id) || !existingBoms.some(b => b.item_id === i.item_id))
                          .map((i) => ({ value: String(i.item_id), label: `${i.item_name} (${i.unit_name})` })),
                      ]}
                    />
                  )}
                />

                <HStack gap={3}>
                  <div style={{ flex: 1 }}>
                    <form.Field
                      name="qty"
                      children={(field) => (
                        <NumberInput
                          label="Volume Rencana"
                          isRequired
                          placeholder="Contoh: 1500"
                          value={field.state.value || null}
                          onChange={(val) => field.handleChange(val || 0)}
                          onBlur={field.handleBlur}
                          statusVariant="attached"
                          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                        />
                      )}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <form.Field
                      name="item_price_id"
                      children={(field) => (
                        <Selector
                          label="Harga"
                          isRequired
                          value={field.state.value}
                          onChange={(val) => {
                            field.handleChange(val);
                          }}
                          onBlur={field.handleBlur}
                          statusVariant="attached"
                          status={getFieldError(field.state.meta.errors, field.state.meta.isTouched)}
                          options={[
                            { value: "", label: priceOptions.length === 0 ? "Pilih item dahulu..." : "Pilih harga..." },
                            ...priceOptions,
                          ]}
                          isDisabled={!formItemId || priceOptions.length === 0}
                        />
                      )}
                    />
                    {formItemId && priceOptions.length === 0 && (
                      <Text size="sm" style={{ marginTop: 4, color: "var(--color-status-warning)" }}>
                        Item ini belum memiliki harga. Tambahkan di Master Item → Harga.
                      </Text>
                    )}
                  </div>
                </HStack>
              </VStack>

              <HStack gap={2} justify="end" style={{ marginTop: 16 }}>
                <Button variant="ghost" label="Batal" type="button" onClick={onCancel} />
                <Button
                  variant="primary"
                  label="Simpan"
                  type="submit"
                  isLoading={isSubmitting}
                  isDisabled={!canSubmit || !selectedProjectId}
                />
              </HStack>
            </VStack>
          );
        }}
      />
    </form>
  );
}
