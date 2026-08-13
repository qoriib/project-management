import { useEffect, useState } from "react";
import { VStack, HStack, Button, TextInput, Selector, Heading } from "@astryxdesign/core";
import { getItems, getItemPrices, type Item, type ItemPrice } from "@/db/queries/master";
import { createBOM, updateBOM, type BillOfMaterial } from "@/db/queries/bom";
import { useAppStore } from "@/store/useAppStore";
import { formatRupiah } from "@/utils/formatters";

interface BOMFormProps {
  stageId?: number;
  initialData?: BillOfMaterial;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BOMForm({ stageId, initialData, onSuccess, onCancel }: BOMFormProps) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const [items, setItems] = useState<Item[]>([]);
  const [itemPrices, setItemPrices] = useState<ItemPrice[]>([]);
  const [stages, setStages] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const [formStageId, setFormStageId] = useState(initialData?.stage_id ? String(initialData.stage_id) : (stageId ? String(stageId) : ""));
  const [itemId, setItemId] = useState(initialData?.item_id ? String(initialData.item_id) : "");
  const [volume, setVolume] = useState(initialData?.planned_volume ? String(initialData.planned_volume) : "");
  const [unitPrice, setUnitPrice] = useState(initialData?.estimated_unit_price ? String(initialData.estimated_unit_price) : "");

  useEffect(() => {
    getItems().then(setItems);
    if (selectedProjectId) {
      import("@/db/queries/bom").then(m => m.getProjectStages(selectedProjectId)).then(data => {
        setStages(data.map(d => ({ value: String(d.stage_id), label: d.stage_name })));
      });
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (itemId) {
      getItemPrices(Number(itemId)).then(setItemPrices);
    } else {
      setItemPrices([]);
      setUnitPrice("");
    }
  }, [itemId]);

  async function handleSave() {
    if (!selectedProjectId || !itemId || !volume || !formStageId) return;
    setSaving(true);
    
    try {
      const data = {
        project_id: selectedProjectId,
        item_id: Number(itemId),
        stage_id: Number(formStageId),
        planned_volume: parseFloat(volume) || 0,
        estimated_unit_price: parseFloat(unitPrice) || 0,
      };

      if (initialData) {
        await updateBOM(initialData.bom_id, data);
      } else {
        await createBOM(data);
      }
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  return (
    <VStack gap={4} padding={4}>
      <Heading level={4}>{initialData ? "Edit Kebutuhan Material" : "Tambah Kebutuhan Material"}</Heading>

      <VStack gap={4} style={{ marginTop: 8 }}>
        <Selector
          label="Tahap Proyek"
          isRequired
          value={formStageId}
          onChange={setFormStageId}
          options={[{ value: "", label: "Pilih Tahap..." }, ...stages]}
        />

        <Selector
          label="Material / Alat"
          hasSearch
          value={itemId}
          onChange={setItemId}
          options={[
            { value: "", label: "Pilih Material/Alat..." },
            ...items.map((i) => ({ value: String(i.item_id), label: `${i.item_name} (${i.unit})` })),
          ]}
        />

        <HStack gap={3}>
          <div style={{ flex: 1 }}>
            <TextInput
              label="Volume Rencana"
              isRequired
              placeholder="Contoh: 1500"
              value={volume}
              onChange={setVolume}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Selector
              label="Varian Harga Satuan"
              value={unitPrice}
              onChange={setUnitPrice}
              options={[
                { value: "", label: itemPrices.length > 0 ? "Pilih Harga..." : "Belum ada varian harga" },
                ...(initialData?.estimated_unit_price && !itemPrices.find(p => p.price === initialData.estimated_unit_price) 
                  ? [{ value: String(initialData.estimated_unit_price), label: `Harga Saat Ini (${formatRupiah(initialData.estimated_unit_price)})` }] 
                  : []),
                ...itemPrices.map((p, idx) => ({ 
                  value: String(p.price), 
                  label: `Harga Varian ${idx + 1} (${formatRupiah(p.price)})` 
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
          isDisabled={!itemId || !volume || !formStageId || !selectedProjectId} 
        />
      </HStack>
    </VStack>
  );
}
