import { useCallback, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Heading, HStack, IconButton, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { useToast } from "@astryxdesign/core/Toast";
import { Download } from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { ProjectRequired } from "@/components/shared/ProjectRequired";
import { OrderTable } from "@/components/order/OrderTable";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import { handleFormError } from "@/utils/form";
import { generateOrderExcel } from "@/db/services/excel";
import { getTimestampString, sanitizeFilename } from "@/utils/formatters";

function OrderListPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const projects = useMasterStore((state) => state.projects);
  const currentProject = projects.find((project) => project.project_id === selectedProjectId);
  const createOrderForProject = useOrderStore((state) => state.createOrderForProject);

  const handleCreateNew = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      const newOrderId = await createOrderForProject(selectedProjectId);
      navigate({ to: `/order/${newOrderId}/edit` });
    } catch (error: unknown) {
      handleFormError(error, showToast);
    }
  }, [selectedProjectId, createOrderForProject, navigate, showToast]);

  const handleExportExcel = useCallback(async () => {
    if (!selectedProjectId) return;
    try {
      setIsExporting(true);
      const timestamp = getTimestampString();
      const projectName = sanitizeFilename(currentProject?.project_name ?? "Proyek");
      const filePath = await save({
        filters: [{ name: "Excel", extensions: ["xlsx"] }],
        defaultPath: `${timestamp}_PO_${projectName}.xlsx`,
        title: "Simpan Laporan PO Excel",
      });

      if (filePath) {
        const buffer = await generateOrderExcel(selectedProjectId);
        await writeFile(filePath, buffer);
        showToast({ body: "Laporan PO Excel berhasil diunduh!", type: "info" });
      }
    } catch (error) {
      console.error("Export PO Excel failed:", error);
      showToast({ body: "Gagal mengunduh laporan PO.", type: "error" });
    } finally {
      setIsExporting(false);
    }
  }, [selectedProjectId, currentProject, showToast]);

  function openEdit(id: string) {
    navigate({ to: `/order/${id}/edit` });
  }

  useKeyboardShortcut({
    key: "n",
    ctrl: true,
    handler: handleCreateNew,
    enabled: Boolean(selectedProjectId),
  });

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Daftar Pengadaan (PO)</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Kelola dan pantau seluruh pengadaan pembelian
              </Text>
            </VStack>
            {selectedProjectId ? (
              <HStack gap={2} vAlign="center">
                <Button variant="primary" label="Buat Baru" onClick={handleCreateNew} />
                <IconButton
                  variant="secondary"
                  icon={<Download />}
                  label="Export Excel"
                  onClick={handleExportExcel}
                  isLoading={isExporting}
                />
              </HStack>
            ) : null}
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <ProjectRequired>
              <OrderTable onEdit={openEdit} />
            </ProjectRequired>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/order/")({
  component: OrderListPage,
});
