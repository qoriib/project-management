import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, VStack } from "@astryxdesign/core";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { PageHeader } from "@/components/shared/PageHeader";
import { MasterVendorTable } from "@/components/master/MasterVendorTable";
import { MasterVendorForm } from "@/components/master/MasterVendorForm";
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
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <PageHeader
              title="Master Vendor"
              subtitle="Kelola data vendor dan pemasok"
              actions={<Button variant="primary" label="Tambah Vendor" onClick={openCreate} />}
            />
            <MasterVendorTable onEdit={openEdit} />
            <MasterVendorForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialData={editTarget} />
          </VStack>
        </LayoutContent>
      }
    />
  );
}
