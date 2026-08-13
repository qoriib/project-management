import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import {
  AppShell, SideNav, SideNavSection, SideNavItem, SideNavHeading,
  Text, VStack
} from "@astryxdesign/core";
import { ListItem } from "@astryxdesign/core/List";
import { NavIcon } from "@astryxdesign/core/NavIcon";
import { useEffect, useState } from "react";
import { getDB } from "@/db";
import { getProjects } from "@/db/queries/master";
import type { Project } from "@/db/schema";
import { useAppStore } from "@/store/useAppStore";
import { Home, Folder, ShoppingCart, Truck, Settings, ClipboardList, Building2 } from "lucide-react";

export const Route = createRootRoute({
  component: AppLayout,
});

function AppLayout() {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const path = routerState.location.pathname;

  const { dbReady, setDbReady, setGlobalError, sideNavCollapsed, setSideNavCollapsed, selectedProjectId, setSelectedProjectId } = useAppStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const activeProject = projects.find(p => p.project_id === selectedProjectId);

  useEffect(() => {
    getDB()
      .then(() => {
        setDbReady(true);
        getProjects().then(setProjects).catch(console.error);
      })
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
              heading={activeProject ? activeProject.project_name : "Manajemen Proyek"}
              subheading={activeProject ? `${activeProject.company_name} - ${activeProject.fiscal_year}` : "Pilih Proyek Aktif"}
              menu={
                <>
                  {projects.map((p) => (
                    <ListItem
                      key={p.project_id}
                      label={p.project_name}
                      description={`${p.company_name} - ${p.fiscal_year}`}
                      onClick={() => setSelectedProjectId(p.project_id)}
                      isSelected={p.project_id === selectedProjectId}
                    />
                  ))}
                  {selectedProjectId && (
                    <ListItem label="Kosongkan Pilihan" onClick={() => setSelectedProjectId(null)} />
                  )}
                </>
              }
            />
          }
        >
          <SideNavSection title="Menu Utama" isHeaderHidden>
            <SideNavItem
              label="Dashboard"
              icon={Home}
              isSelected={path === "/" || path === "/dashboard"}
              onClick={() => navigate({ to: "/dashboard" })}
            />
            <SideNavItem
              label="Rencana Kebutuhan"
              icon={ClipboardList}
              isSelected={path.startsWith("/bom")}
              onClick={() => navigate({ to: "/bom" })}
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
              label="Master Data"
              icon={Folder}
              isSelected={path.startsWith("/master")}
              onClick={() => navigate({ to: "/master" })}
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
