import { Button, Dialog, VStack, Text, HStack, Heading } from "@astryxdesign/core";
import { Selector } from "@astryxdesign/core/Selector";
import { useState, useEffect } from "react";
import { useMasterStore } from "@/store/useMasterStore";

interface SettingsExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (projectId: string) => void;
  isLoading: boolean;
}

export function SettingsExportDialog({ isOpen, onClose, onConfirm, isLoading }: SettingsExportDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const projects = useMasterStore((state) => state.projects);

  useEffect(() => {
    if (isOpen) {
      setSelectedProjectId(projects[0]?.project_id || null);
    }
  }, [isOpen, projects]);

  const projectOptions = projects.map((p) => ({
    label: p.project_name,
    value: p.project_id,
  }));

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
      width={400}
    >
      <VStack gap={4}>
        <Heading level={3}>Ekspor Data</Heading>
        <Text color="secondary">
          Pilih proyek mana yang ingin Anda ekspor. File backup ini dapat digunakan untuk memindahkan data proyek.
        </Text>

        <Selector
          label="Pilih Proyek"
          value={selectedProjectId || ""}
          options={projectOptions}
          onChange={(val) => {
            setSelectedProjectId(val || null);
          }}
          hasSearch
          searchPlaceholder="Cari proyek..."
        />

        <HStack gap={2} justify="end" style={{ marginTop: "var(--spacing-2)" }}>
          <Button variant="secondary" onClick={onClose} isDisabled={isLoading} label="Batal" />
          <Button
            variant="primary"
            onClick={() => {
              if (selectedProjectId) onConfirm(selectedProjectId);
            }}
            isDisabled={isLoading || !selectedProjectId}
            isLoading={isLoading}
            label="Mulai Ekspor"
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}
