import { useEffect, useState } from "react";
import { VStack, HStack, Button, TextInput, Selector, Heading } from "@astryxdesign/core";
import { getItems, getItemPrices, type Item, type ItemPrice } from "@/db/queries/master";
import { createBOM, updateBOM, type BillOfMaterial } from "@/db/queries/bom";
import { useAppStore } from "@/store/useAppStore";
import { formatRupiah } from "@/utils/formatters";

interface BOMFormProps {
  stageId?: number;
  initialData?: BillOfMaterial;
  isInline?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BOMForm({ stageId, initialData, isInline, onSuccess, onCancel }: BOMFormProps) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const [items, setItems] = useState<Item[]>([]);
  const [existingBoms, setExistingBoms] = useState<BillOfMaterial[]>([]);
  const [itemPrices, setItemPrices] = useState<ItemPrice[]>([]);
  const [stages, setStages] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const [formStageId, setFormStageId] = useState(initialData?.stage_id ? String(initialData.stage_id) : (stageId ? String(stageId) : ""));
  const [itemId, setItemId] = useState(initialData?.item_id ? String(initialData.item_id) : "");
  const [qty, setQty] = useState(initialData?.qty ? String(initialData.qty) : "");
  const [itemPriceId, setItemPriceId] = useState(initialData?.item_price_id ? String(initialData.item_price_id) : "");

  // Update state when initialData or stageId changes (important for inline forms that don't unmount)
  useEffect(() => {
    if (initialData) {
      setFormStageId(String(initialData.stage_id));
      setItemId(String(initialData.item_id));
      setQty(String(initialData.qty));
      setItemPriceId(String(initialData.item_price_id));
    } else if (stageId) {
      setFormStageId(String(stageId));
      setItemId("");
      setQty("");
      setItemPriceId("");
    }
  }, [initialData, stageId]);

  useEffect(() => {
    getItems().then(setItems);
    if (selectedProjectId) {
      import("@/db/queries/bom").then(m => m.getProjectStages(selectedProjectId)).then(data => {
        setStages(data.map(d => ({ value: String(d.stage_id), label: d.stage_name })));
      });
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId && formStageId) {
      import("@/db/queries/bom").then(m => 
        m.getBOMs({ project_id: selectedProjectId, stage_id: Number(formStageId) })
      ).then(setExistingBoms);
    } else {
      setExistingBoms([]);
    }
  }, [selectedProjectId, formStageId]);

  useEffect(() => {
    if (itemId) {
      getItemPrices(Number(itemId)).then(prices => {
        setItemPrices(prices);
        if (prices.length > 0) {
          // Auto-select first price if not currently editing a specific price
          setItemPriceId(prev => prev || String(prices[0].price_id));
        }
      });
    } else {
      setItemPrices([]);
      setItemPriceId("");
    }
  }, [itemId]);

  async function handleSave() {
    if (!selectedProjectId || !itemId || !qty || !formStageId) return;
    setSaving(true);
    
    try {
      const data = {
        project_id: selectedProjectId,
        item_id: Number(itemId),
        stage_id: Number(formStageId),
        qty: parseFloat(qty) || 0,
        item_price_id: Number(itemPriceId) || 0,
      };

      if (initialData) {
        await updateBOM(initialData.bom_id, data);
      } else {
        await createBOM(data);
        if (isInline) {
          setItemId("");
          setQty("");
          setItemPriceId("");
        }
      }
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  if (isInline) {
    return (
      <HStack gap={3} align="end" padding={3}>
        <div style={{ flex: 2 }}>
          <Selector
            label="Material / Alat"
            hasSearch
            value={itemId}
            onChange={(val) => {
              setItemId(val);
              setItemPriceId("");
            }}
            options={[
              { value: "", label: "Pilih Material/Alat..." },
              ...items
                .filter(i => 
                  // Include if it's the currently edited item, or if it's NOT in existingBoms
                  (initialData?.item_id === i.item_id) || 
                  !existingBoms.some(b => b.item_id === i.item_id)
                )
                .map((i) => ({ value: String(i.item_id), label: `${i.item_name} (${i.unit})` })),
            ]}
          />
        </div>
        <div style={{ flex: 1 }}>
          <TextInput
            label="Volume Rencana"
            placeholder="Contoh: 1500"
            value={qty}
            onChange={setQty}
          />
        </div>
        <div style={{ flex: 2 }}>
          <Selector
            label="Varian Harga Satuan"
            value={itemPriceId}
            onChange={setItemPriceId}
            options={[
              { value: "", label: itemPrices.length > 0 ? "Pilih Harga..." : "Belum ada varian harga" },
              ...(initialData?.item_price_id && !itemPrices.find(p => p.price_id === initialData.item_price_id) 
                ? [{ value: String(initialData.item_price_id), label: `Saat Ini: ${formatRupiah(initialData.estimated_unit_price || 0)}` }] 
                : []),
              ...itemPrices.map((p) => ({ 
                value: String(p.price_id), 
                label: formatRupiah(p.price) 
              })),
            ]}
          />
        </div>
        <Button 
          variant="primary" 
          label={initialData ? "Simpan Edit" : "Tambah BOM"} 
          onClick={handleSave} 
          isLoading={saving} 
          isDisabled={!itemId || !qty || !formStageId || !selectedProjectId} 
        />
        {initialData && <Button variant="ghost" label="Batal" onClick={onCancel} />}
      </HStack>
    );
  }

  return (
    <VStack gap={4} padding={4}>
      <Heading level={4}>{initialData ? "Edit Kebutuhan Material" : "Tambah Kebutuhan Material"}</Heading>

      <VStack gap={4} style={{ marginTop: 8 }}>
        {(!stageId || initialData) && (
          <Selector
            label="Tahap Proyek"
            isRequired
            value={formStageId}
            onChange={setFormStageId}
            options={[{ value: "", label: "Pilih Tahap..." }, ...stages]}
          />
        )}

        <Selector
          label="Material / Alat"
          hasSearch
          value={itemId}
          onChange={(val) => {
            setItemId(val);
            setItemPriceId("");
          }}
          options={[
            { value: "", label: "Pilih Material/Alat..." },
            ...items
              .filter(i => 
                (initialData?.item_id === i.item_id) || 
                !existingBoms.some(b => b.item_id === i.item_id)
              )
              .map((i) => ({ value: String(i.item_id), label: `${i.item_name} (${i.unit})` })),
          ]}
        />

        <HStack gap={3}>
          <div style={{ flex: 1 }}>
            <TextInput
              label="Volume Rencana"
              isRequired
              placeholder="Contoh: 1500"
              value={qty}
              onChange={setQty}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Selector
              label="Varian Harga Satuan"
              value={itemPriceId}
              onChange={setItemPriceId}
              options={[
                { value: "", label: itemPrices.length > 0 ? "Pilih Harga..." : "Belum ada varian harga" },
                ...(initialData?.item_price_id && !itemPrices.find(p => p.price_id === initialData.item_price_id) 
                  ? [{ value: String(initialData.item_price_id), label: `Saat Ini: ${formatRupiah(initialData.estimated_unit_price || 0)}` }] 
                  : []),
                ...itemPrices.map((p) => ({ 
                  value: String(p.price_id), 
                  label: formatRupiah(p.price) 
                })),
              ]}
            />
          </div>
        </HStack>
      </VStack>

      <HStack gap={2} justify="end" style={{ marginTop: 16 }}>
        <Button variant="ghost" label="Batal" onClick={onCancel} />
        <Button 
          variant="primary" 
          label="Simpan" 
          onClick={handleSave} 
          isLoading={saving} 
          isDisabled={!itemId || !qty || !formStageId || !selectedProjectId} 
        />
      </HStack>
    </VStack>
  );
}
