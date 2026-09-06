import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { MasterCategoryTable } from "@/components/master/MasterCategoryTable";
import { MasterCategoryForm } from "@/components/master/MasterCategoryForm";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import type { ItemCategory } from "@/db/repositories";

export const Route = createFileRoute("/master/category")({
  component: MasterCategoryPage,
});

function MasterCategoryPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemCategory | null>(null);

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

  function openEdit(category: ItemCategory) {
    setEditTarget(category);
    setIsFormOpen(true);
  }

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Master Kategori</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Kelola kategori klasifikasi item
              </Text>
            </VStack>
            <Button variant="primary" label="Tambah Kategori" onClick={openCreate} />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <MasterCategoryTable onEdit={openEdit} />
            <MasterCategoryForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editTarget} />
          </VStack>
        </LayoutContent>
      }
    />
  );
}
