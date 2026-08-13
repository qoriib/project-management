import { useState } from "react";
import { VStack, HStack, Button, TextInput, Heading } from "@astryxdesign/core";
import { createProjectStage, updateProjectStage, type ProjectStage } from "@/db/queries/bom";
import { useAppStore } from "@/store/useAppStore";

interface ProjectStageFormProps {
  initialData?: ProjectStage;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProjectStageForm({ initialData, onSuccess, onCancel }: ProjectStageFormProps) {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const [saving, setSaving] = useState(false);
  const [stageName, setStageName] = useState(initialData?.stage_name || "");

  async function handleSave() {
    if (!selectedProjectId || !stageName.trim()) return;
    setSaving(true);
    
    try {
      const data = {
        project_id: selectedProjectId,
        stage_name: stageName.trim(),
      };

      if (initialData) {
        await updateProjectStage(initialData.stage_id, data);
      } else {
        await createProjectStage(data);
      }
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  return (
    <VStack gap={4} padding={4}>
      <Heading level={3}>{initialData ? "Edit Tahap Proyek" : "Tambah Tahap Proyek"}</Heading>

      <TextInput
        label="Nama Tahap"
        isRequired
        placeholder="Contoh: Pekerjaan Pondasi, Struktur Atas, dll"
        value={stageName}
        onChange={setStageName}
      />

      <HStack gap={2} justify="end" style={{ marginTop: 16 }}>
        <Button variant="ghost" label="Batal" onClick={onCancel} />
        <Button 
          variant="primary" 
          label="Simpan" 
          onClick={handleSave} 
          isLoading={saving} 
          isDisabled={!stageName.trim() || !selectedProjectId} 
        />
      </HStack>
    </VStack>
  );
}
