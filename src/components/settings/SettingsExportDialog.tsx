import { useEffect, useState } from "react";
import { Button, Dialog, HStack, Heading } from "@astryxdesign/core";
import { Selector } from "@astryxdesign/core/Selector";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
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
      width={520}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleExport();
        }}
      >
        <Layout
          header={
            <LayoutHeader hasDivider>
              <Heading level={3}>Ekspor Data Proyek</Heading>
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={4}>
              <FormLayout>
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
              </FormLayout>
            </LayoutContent>
          }
          footer={
            <LayoutFooter hasDivider>
              <HStack gap={2} justify="end" width="100%">
                <Button variant="secondary" onClick={onClose} isDisabled={isLoading} label="Batal" type="button" />
                <Button
                  variant="primary"
                  type="submit"
                  isDisabled={isLoading || !selectedProjectId}
                  isLoading={isLoading}
                  label="Mulai Ekspor"
                />
              </HStack>
            </LayoutFooter>
          }
        />
      </form>
    </Dialog>
  );
}
