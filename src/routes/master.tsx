import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { Section, VStack } from "@astryxdesign/core";
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

  return (
    <Section padding={6}>
      <VStack gap={4}>
        <PageHeader
          title="Master Data"
          subtitle="Kelola data referensi utama untuk transaksi proyek"
        />

        <TabList 
          value={currentTab} 
          onChange={(value) => {
            if (value === "item") {
              navigate({ to: "/master" });
            } else {
              navigate({ to: `/master/${value}` });
            }
          }} 
          hasDivider
        >
          <Tab value="item" label="Item" />
          <Tab value="vendor" label="Vendor" />
          <Tab value="kategori" label="Kategori" />
          <Tab value="satuan" label="Satuan" />
          <Tab value="project" label="Project" />
        </TabList>

        <Outlet />
      </VStack>
    </Section>
  );
}

