import { createRootRoute, Outlet, useRouterState, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { AppShell, SideNav, SideNavSection, SideNavItem, SideNavHeading, Text, VStack } from "@astryxdesign/core";
import { ListItem } from "@astryxdesign/core/List";
import { useEffect, useState } from "react";
import { getDB } from "@/db";
import { projectRepo, type Project } from "@/db/repositories";
import { useAppStore } from "@/store/useAppStore";
import { APP } from '@/configs/app.config';

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
        projectRepo.findAllWithStages().then(setProjects).catch(console.error);
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
              heading={activeProject ? activeProject.project_name : APP.title}
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
            {APP.sidenav.map((sidenavItem) => (
              <SideNavItem
                key={sidenavItem.href}
                label={sidenavItem.label}
                icon={sidenavItem.icon}
                isSelected={path.startsWith(sidenavItem.href)}
                onClick={() => navigate({ to: sidenavItem.href })}
              />
            ))}
          </SideNavSection>
        </SideNav>
      }
    >
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </AppShell>
  );
}
