import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { Heading, HStack, Text } from "@astryxdesign/core";
import { Layout, LayoutContent, LayoutHeader, VStack } from "@astryxdesign/core/Layout";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { APP } from "@/configs/app.config";

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
      header={
        <LayoutHeader hasDivider padding={6}>
          <HStack gap={2} vAlign="center" hAlign="between">
            <VStack gap={0.5}>
              <Heading level={3}>Pengaturan</Heading>
              <Text color="secondary" wordBreak="break-word" textWrap="wrap">
                Kelola database, keamanan PIN, dan preferensi aplikasi
              </Text>
            </VStack>
          </HStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={6}>
          <VStack gap={4}>
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
