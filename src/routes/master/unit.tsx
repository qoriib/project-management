import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { MasterUnitTable } from "@/components/master/MasterUnitTable";
import { MasterUnitForm } from "@/components/master/MasterUnitForm";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import type { Unit } from "@/db/repositories";

export const Route = createFileRoute("/master/unit")({
  component: MasterUnitPage,
});

function MasterUnitPage() {
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
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Master Satuan</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Kelola satuan ukuran item
              </Text>
            </VStack>
            <Button variant="primary" label="Tambah Satuan" onClick={openCreate} />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <MasterUnitTable onEdit={openEdit} />
            <MasterUnitForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editTarget} />
          </VStack>
        </LayoutContent>
      }
    />
  );
}
