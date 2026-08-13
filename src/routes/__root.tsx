import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import {
  AppShell, SideNav, SideNavSection, SideNavItem, SideNavHeading, Icon,
  Text, VStack
} from "@astryxdesign/core";
import { useEffect } from "react";
import { getDB } from "@/db";
import { useAppStore } from "@/store/useAppStore";
import { Home, Folder, ShoppingCart, Truck, Settings, Briefcase } from "lucide-react";

export const Route = createRootRoute({
  component: AppLayout,
});

function AppLayout() {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const path = routerState.location.pathname;

  const { dbReady, setDbReady, setGlobalError, sideNavCollapsed, setSideNavCollapsed } = useAppStore();

  useEffect(() => {
    getDB()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error("DB init failed:", err);
        setGlobalError("Gagal membuka database. Pastikan aplikasi berjalan melalui Tauri.");
        setDbReady(true); // allow UI to render in dev mode
      });
  }, [setDbReady, setGlobalError]);

  if (!dbReady) {
    return (
      <VStack gap={2} align="center" justify="center" style={{ height: "100dvh" }}>
        <Text color="secondary">Memuat database…</Text>
      </VStack>
    );
  }

  return (
    <AppShell
      height="fill"
      variant="elevated"
      sideNav={
        <SideNav
          collapsible={{ hasButton: true, isCollapsed: sideNavCollapsed, onCollapsedChange: setSideNavCollapsed }}
          header={
            <SideNavHeading
              heading="Manajemen Proyek"
            />
          }
        >
          <SideNavSection isHeaderHidden>
            <SideNavItem
              label="Dashboard"
              icon={Home}
              isSelected={path === "/" || path === "/dashboard"}
              onClick={() => navigate({ to: "/dashboard" })}
            />
            <SideNavItem
              label="Master Data"
              icon={Folder}
              isSelected={path.startsWith("/master")}
              onClick={() => navigate({ to: "/master" })}
            />
            <SideNavItem
              label="Pemesanan"
              icon={ShoppingCart}
              isSelected={path.startsWith("/po")}
              onClick={() => navigate({ to: "/po" })}
            />
            <SideNavItem
              label="Penerimaan"
              icon={Truck}
              isSelected={path.startsWith("/delivery")}
              onClick={() => navigate({ to: "/delivery" })}
            />
            <SideNavItem
              label="Log Alat Berat"
              icon={Settings}
              isSelected={path.startsWith("/equipment")}
              onClick={() => navigate({ to: "/equipment" })}
            />
          </SideNavSection>
        </SideNav>
      }
    >
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </AppShell>
  );
}
