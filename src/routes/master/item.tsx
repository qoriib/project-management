import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { MasterItemTable } from "@/components/master/MasterItemTable";
import { MasterItemForm } from "@/components/master/MasterItemForm";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import type { ItemWithDetails } from "@/db/repositories";

export const Route = createFileRoute("/master/item")({
  component: MasterItemPage,
});

function MasterItemPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemWithDetails | null>(null);

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

  function openEdit(item: ItemWithDetails) {
    setEditTarget(item);
    setIsFormOpen(true);
  }

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Master Item</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Kelola data master item
              </Text>
            </VStack>
            <Button variant="primary" label="Tambah Item" onClick={openCreate} />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <MasterItemTable onEdit={openEdit} />
            <MasterItemForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editTarget} />
          </VStack>
        </LayoutContent>
      }
    />
  );
}
