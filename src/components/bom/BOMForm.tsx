import { useEffect, useState } from "react";
import { VStack, HStack, Button, Selector, Heading } from "@astryxdesign/core";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import {
  bomRepo,
  type BillOfMaterial,
  type BOMDetail,
} from "@/db/repositories";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";

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
  const [saving, setSaving] = useState(false);

  const [formStageId, setFormStageId] = useState(initialData?.stage_id ? String(initialData.stage_id) : (stageId ? String(stageId) : ""));
  const [itemId, setItemId] = useState(initialData?.item_id ? String(initialData.item_id) : "");
  const [qty, setQty] = useState<number | null>(initialData?.qty ? Number(initialData.qty) : null);
  const [price, setPrice] = useState<number | null>(initialData?.price ? Number(initialData.price) : null);

  // Update state when initialData or stageId changes (important for inline forms that don't unmount)
  useEffect(() => {
    if (initialData) {
      setFormStageId(String(initialData.stage_id));
      setItemId(String(initialData.item_id));
      setQty(Number(initialData.qty));
      setPrice(Number(initialData.price));
    } else if (stageId) {
      setFormStageId(String(stageId));
      setItemId("");
      setQty(null);
      setPrice(null);
    }
  }, [initialData, stageId]);

  useEffect(() => {
    if (selectedProjectId) {
      bomRepo.findStagesByProject(selectedProjectId).then(data => {
        setStages(data.map(d => ({ value: String(d.stage_id), label: d.stage_name })));
      });
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId && formStageId) {
      bomRepo.findAllWithDetails({ project_id: selectedProjectId, stage_id: Number(formStageId) }).then(setExistingBoms);
    } else {
      setExistingBoms([]);
    }
  }, [selectedProjectId, formStageId]);

  async function handleSave() {
    if (!selectedProjectId || !itemId || !qty || !formStageId) return;
    setSaving(true);
    
    try {
      const data = {
        project_id: selectedProjectId,
        item_id: Number(itemId),
        stage_id: Number(formStageId),
        qty: qty || 0,
        price: price || 0,
      };

      if (initialData) {
        await bomRepo.update(initialData.bom_id, data);
      } else {
        await bomRepo.create(data);
        if (isInline) {
          setItemId("");
          setQty(null);
          setPrice(null);
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
            }}
            options={[
              { value: "", label: "Pilih Material/Alat..." },
              ...items
                .filter(i => 
                  // Include if it's the currently edited item, or if it's NOT in existingBoms
                  (initialData?.item_id === i.item_id) || 
                  !existingBoms.some(b => b.item_id === i.item_id)
                )
                .map((i) => ({ value: String(i.item_id), label: `${i.item_name} (${i.unit_name})` })),
            ]}
          />
        </div>
        <div style={{ flex: 1 }}>
          <NumberInput
            label="Volume Rencana"
            placeholder="Contoh: 1500"
            value={qty}
            onChange={setQty}
          />
        </div>
        <div style={{ flex: 2 }}>
          <NumberInput
            label="Harga Rencana (Rp)"
            placeholder="Contoh: 50000"
            value={price}
            onChange={setPrice}
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
          }}
          options={[
            { value: "", label: "Pilih Material/Alat..." },
            ...items
              .filter(i => 
                (initialData?.item_id === i.item_id) || 
                !existingBoms.some(b => b.item_id === i.item_id)
              )
              .map((i) => ({ value: String(i.item_id), label: `${i.item_name} (${i.unit_name})` })),
          ]}
        />

        <HStack gap={3}>
          <div style={{ flex: 1 }}>
            <NumberInput
              label="Volume Rencana"
              isRequired
              placeholder="Contoh: 1500"
              value={qty}
              onChange={setQty}
            />
          </div>
          <div style={{ flex: 1 }}>
            <NumberInput
              label="Harga Rencana (Rp)"
              isRequired
              placeholder="Contoh: 50000"
              value={price}
              onChange={setPrice}
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
