import { useEffect, useState } from "react";
import { Button, Dialog, HStack, Heading, Text, VStack } from "@astryxdesign/core";
import { Selector } from "@astryxdesign/core/Selector";
import { FormLayout } from "@astryxdesign/core/FormLayout";
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

  const handleExport = () => {
    if (selectedProjectId) {
      onConfirm(selectedProjectId);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
      width={520}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleExport();
        }}
      >
        <VStack gap={3}>
          <Heading level={3}>Ekspor Data Proyek</Heading>
          <FormLayout>
            <Text type="supporting" color="secondary">
              Pilih proyek mana yang ingin Anda ekspor. File backup ini dapat digunakan untuk memindahkan data proyek.
            </Text>

            <Selector
              isRequired
              label="Pilih Proyek"
              value={selectedProjectId || ""}
              options={projectOptions}
              onChange={(val) => {
                setSelectedProjectId(val || null);
              }}
              hasSearch
              searchPlaceholder="Cari proyek..."
            />

            <HStack gap={2} justify="end">
              <Button variant="secondary" onClick={onClose} isDisabled={isLoading} label="Batal" type="button" />
              <Button
                variant="primary"
                type="submit"
                isDisabled={isLoading || !selectedProjectId}
                isLoading={isLoading}
                label="Mulai Ekspor"
              />
            </HStack>
          </FormLayout>
        </VStack>
      </form>
    </Dialog>
  );
}
