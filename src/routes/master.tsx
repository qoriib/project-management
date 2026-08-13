import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { Section, VStack, Button } from "@astryxdesign/core";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/master")({
  component: MasterLayout,
});

function MasterLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // extract the last part of the path, defaulting to "item" for /master
  let currentTab = location.pathname.split("/").pop() || "item";
  if (currentTab === "master") currentTab = "item";

  const actionLabels: Record<string, string> = {
    item: "Tambah Item",
    vendor: "Tambah Vendor",
    kategori: "Tambah Kategori",
    satuan: "Tambah Satuan",
    project: "Tambah Project",
  };
  const currentActionLabel = actionLabels[currentTab] || "Tambah";

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Master Data"
          subtitle="Kelola data referensi utama untuk transaksi proyek"
          actions={
            <Button
              variant="primary"
              label={currentActionLabel}
              onClick={() => window.dispatchEvent(new CustomEvent('openMasterCreate'))}
            />
          }
        />
        <TabList
          hasDivider
          value={currentTab}
          onChange={(value) => {
            if (value === "item") {
              navigate({ to: "/master" });
            } else {
              navigate({ to: `/master/${value}` });
            }
          }}
        >
          <Tab value="item" label="Item" />
          <Tab value="vendor" label="Vendor" />
          <Tab value="kategori" label="Kategori" />
          <Tab value="satuan" label="Satuan" />
          <Tab value="project" label="Proyek" />
        </TabList>

        <Outlet />
      </VStack>
    </Section>
  );
}
