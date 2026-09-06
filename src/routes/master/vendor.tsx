import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Heading, HStack, Text, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader } from "@astryxdesign/core/Layout";
import { MasterVendorTable } from "@/components/master/MasterVendorTable";
import { MasterVendorForm } from "@/components/master/MasterVendorForm";
import { useKeyboardShortcut } from "@/utils/useKeyboardShortcut";
import type { Vendor } from "@/db/repositories";

export const Route = createFileRoute("/master/vendor")({
  component: MasterVendorPage,
});

function MasterVendorPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);

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

  function openEdit(vendor: Vendor) {
    setEditTarget(vendor);
    setIsFormOpen(true);
  }

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Master Vendor</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Kelola data vendor dan pemasok
              </Text>
            </VStack>
            <Button variant="primary" label="Tambah Vendor" onClick={openCreate} />
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <MasterVendorTable onEdit={openEdit} />
            <MasterVendorForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editTarget} />
          </VStack>
        </LayoutContent>
      }
    />
  );
}
