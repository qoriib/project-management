import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { MasterUnitTable } from "@/components/master/MasterUnitTable";
import { MasterUnitForm } from "@/components/master/MasterUnitForm";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import type { Unit } from "@/db/repositories";

export const Route = createFileRoute("/master/satuan")({
  component: MasterSatuanPage,
});

function MasterSatuanPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Unit | null>(null);

  useEffect(() => {
    const handleOpen = () => openCreate();
    window.addEventListener("openMasterCreate", handleOpen);
    return () => window.removeEventListener("openMasterCreate", handleOpen);
  }, []);

  const dispatchCreate = useCallback(() => {
    window.dispatchEvent(new CustomEvent("openMasterCreate"));
  }, []);

  useKeyboardShortcut({ key: "n", ctrl: true, handler: dispatchCreate });

  function openCreate() {
    setEditTarget(null);
    setIsFormOpen(true);
  }

  function openEdit(unit: Unit) {
    setEditTarget(unit);
    setIsFormOpen(true);
  }

  return (
    <Layout
      height="fill"
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <PageHeader
              title="Master Satuan"
              subtitle="Kelola satuan ukuran item"
              actions={<Button variant="primary" label="Tambah Satuan" onClick={openCreate} />}
            />
            <MasterUnitTable onEdit={openEdit} />
            <MasterUnitForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editTarget} />
          </VStack>
        </LayoutContent>
      }
    />
  );
}
