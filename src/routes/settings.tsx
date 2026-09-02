import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { Layout, LayoutContent, VStack } from "@astryxdesign/core/Layout";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { APP } from "@/configs/app.config";
import { PageHeader } from "@/components/shared/PageHeader";

function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate({ from: "/settings" });
  const activeNav = APP.settingsNav.find((item) => item.href === location.pathname)?.id || APP.settingsNav[0]?.id;

  const handleTabChange = (val: string) => {
    const target = APP.settingsNav.find((i) => i.id === val);

    if (target?.href) {
      navigate({ to: target.href });
    }
  };

  return (
    <Layout
      height="fill"
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
            <PageHeader title="Pengaturan" subtitle="Kelola database, keamanan PIN, dan preferensi aplikasi" compact />
            <TabList hasDivider value={activeNav} onChange={handleTabChange}>
              {APP.settingsNav.map((item) => (
                <Tab key={item.id} value={item.id} label={item.label} />
              ))}
            </TabList>
            <Outlet />
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
  beforeLoad: ({ location }) => {
    if (location.pathname === "/settings" || location.pathname === "/settings/") {
      throw redirect({ to: "/settings/database" });
    }
  },
});
