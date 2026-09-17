import { useEffect, useState } from "react";
import { Button, Dialog, HStack, Heading, Text } from "@astryxdesign/core";
import { Selector } from "@astryxdesign/core/Selector";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Layout, LayoutContent, LayoutFooter, LayoutHeader } from "@astryxdesign/core/Layout";
import { useMasterStore } from "@/store/useMasterStore";

type ExportMode = "project" | "master";

interface SettingsExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** projectId = string untuk mode project, null untuk mode master */
  onConfirm: (projectId: string | null) => void;
  isLoading: boolean;
}

export function SettingsExportDialog({ isOpen, onClose, onConfirm, isLoading }: SettingsExportDialogProps) {
  const [mode, setMode] = useState<ExportMode>("project");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const projects = useMasterStore((state) => state.projects);

  useEffect(() => {
    if (isOpen) {
      setMode("project");
      setSelectedProjectId(projects[0]?.project_id || null);
    }
  }, [isOpen, projects]);

  const projectOptions = projects.map((project) => ({
    label: project.project_name,
    value: project.project_id,
  }));

  const handleExport = () => {
    if (mode === "master") {
      onConfirm(null);
    } else if (selectedProjectId) {
      onConfirm(selectedProjectId);
    }
  };

  const isSubmitDisabled = isLoading || (mode === "project" && !selectedProjectId);

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
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          handleExport();
        }}
      >
        <Layout
          header={
            <LayoutHeader hasDivider>
              <Heading level={3}>Ekspor Data</Heading>
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={4}>
              <FormLayout>
                <Selector
                  label="Mode Ekspor"
                  value={mode}
                  onChange={(val) => setMode(val as ExportMode)}
                  options={[
                    { value: "project", label: "Per Proyek" },
                    { value: "master", label: "Master Data Saja" },
                  ]}
                />
                {mode === "project" ? (
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
                ) : (
                  <Text type="supporting" color="secondary">
                    Hanya tabel master (vendor, item, kategori, satuan, harga) yang akan diekspor. Data proyek tidak
                    disertakan.
                  </Text>
                )}
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
                  isDisabled={isSubmitDisabled}
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
