import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import {
  AppShell, SideNav, SideNavSection, SideNavItem, SideNavHeading, Icon,
  Text, VStack,
} from "@astryxdesign/core";
import { useEffect } from "react";
import { getDB } from "@/db";
import { useAppStore } from "@/store/useAppStore";

function ProjectMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 19h16M6 19V7.5L12 4l6 3.5V19M9 19v-5h6v5M10.5 7.25h3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
          resizable={{ defaultWidth: 240, minWidth: 200, maxWidth: 320, autoSaveId: "sidenav-width" }}
          header={
            <SideNavHeading
              icon={<Icon icon={ProjectMarkIcon} size="lg" color="accent" />}
              heading="Manajemen Proyek"
            />
          }
        >
          <SideNavItem
            label="Dashboard"
            icon="dashboard"
            isSelected={path === "/" || path === "/dashboard"}
            onClick={() => navigate({ to: "/dashboard" })}
          />

          <SideNavSection title="Master Data">
            <SideNavItem
              label="Proyek & Vendor"
              icon="folder"
              isSelected={path.startsWith("/master/projects")}
              onClick={() => navigate({ to: "/master/projects" })}
            />
            <SideNavItem
              label="Katalog Material"
              icon="package"
              isSelected={path.startsWith("/master/catalog")}
              onClick={() => navigate({ to: "/master/catalog" })}
            />
          </SideNavSection>

          <SideNavSection title="Pemesanan (PO)">
            <SideNavItem
              label="Daftar PO"
              icon="list"
              isSelected={path === "/po" || (path.startsWith("/po/") && !path.includes("new") && !path.includes("edit"))}
              onClick={() => navigate({ to: "/po" })}
            />
            <SideNavItem
              label="Buat PO Baru"
              icon="plus"
              isSelected={path === "/po/new"}
              onClick={() => navigate({ to: "/po/new" })}
            />
          </SideNavSection>

          <SideNavSection title="Lapangan">
            <SideNavItem
              label="Input Pengiriman"
              icon="truck"
              isSelected={path === "/delivery/new"}
              onClick={() => navigate({ to: "/delivery/new" })}
            />
            <SideNavItem
              label="Rekap Pengiriman"
              icon="archive"
              isSelected={path === "/delivery/history"}
              onClick={() => navigate({ to: "/delivery/history" })}
            />
            <SideNavItem
              label="Log Alat Berat & Solar"
              icon="settings"
              isSelected={path.startsWith("/equipment")}
              onClick={() => navigate({ to: "/equipment" })}
            />
          </SideNavSection>

          <SideNavSection title="Keuangan">
            <SideNavItem
              label="Input Tagihan"
              icon="file-text"
              isSelected={path.startsWith("/billing/invoice")}
              onClick={() => navigate({ to: "/billing/invoice" })}
            />
            <SideNavItem
              label="Manajemen Utang"
              icon="credit-card"
              isSelected={path.startsWith("/billing/debt")}
              onClick={() => navigate({ to: "/billing/debt" })}
            />
          </SideNavSection>

          <SideNavSection title="Laporan">
            <SideNavItem
              label="Laporan Biaya"
              icon="bar-chart"
              isSelected={path.startsWith("/reports/cost")}
              onClick={() => navigate({ to: "/reports/cost" })}
            />
            <SideNavItem
              label="Export & Backup"
              icon="download"
              isSelected={path.startsWith("/reports/export")}
              onClick={() => navigate({ to: "/reports/export" })}
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
