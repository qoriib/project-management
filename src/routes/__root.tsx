import { createRootRoute, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AppShell, SideNav, SideNavSection, SideNavItem, SideNavHeading, Text, VStack } from "@astryxdesign/core";
import { IconButton } from "@astryxdesign/core/IconButton";
import { ListItem } from "@astryxdesign/core/List";
import { useEffect } from "react";
import { Sun, Moon } from 'lucide-react';
import { getDB } from "@/db";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { APP } from '@/configs/app.config';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return <AppLayout />;
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeNav = useAppStore((s) => s.activeNav);
  const setActiveNav = useAppStore((s) => s.setActiveNav);
  const resolvedMode = useAppStore((s) => s.resolvedMode);
  const toggleThemeMode = useAppStore((s) => s.toggleThemeMode);

  const { dbReady, setDbReady, setGlobalError, selectedProjectId, setSelectedProjectId } = useAppStore();

  const projects = useMasterStore((state) => state.projects);
  const activeProject = projects.find(p => p.project_id === selectedProjectId);

  // Sync activeNav with the current route (supports direct URL hits / refresh)
  useEffect(() => {
    setActiveNav(location.pathname);
  }, [location.pathname, setActiveNav]);

  useEffect(() => {
    getDB()
      .then(() => {
        setDbReady(true);
        useMasterStore.getState().loadAllMasters();
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
          footerIcons={
            <IconButton
              label={resolvedMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              icon={resolvedMode === 'dark' ? <Sun size="1em" aria-hidden /> : <Moon size="1em" aria-hidden />}
              variant="ghost"
              onClick={toggleThemeMode}
            />
          }
        >
          <SideNavSection title="Menu Utama" isHeaderHidden>
            {APP.sidenav.map((sidenavItem) => {
              if (sidenavItem.subitems) {
                return (
                  <SideNavItem
                    key={sidenavItem.label}
                    label={sidenavItem.label}
                    icon={sidenavItem.icon}
                    collapsible={{ defaultIsCollapsed: true }}
                  >
                    {sidenavItem.subitems.map((sub) => (
                      <SideNavItem
                        key={sub.href}
                        label={sub.label}
                        isSelected={activeNav === sub.href || activeNav.startsWith(`${sub.href}/`)}
                        onClick={() => {
                          setActiveNav(sub.href);
                          navigate({ to: sub.href });
                        }}
                      />
                    ))}
                  </SideNavItem>
                );
              }

              return (
                <SideNavItem
                  key={sidenavItem.href}
                  label={sidenavItem.label}
                  icon={sidenavItem.icon}
                  isSelected={activeNav === sidenavItem.href || (sidenavItem.href !== '/' && activeNav.startsWith(`${sidenavItem.href}/`))}
                  onClick={() => {
                    setActiveNav(sidenavItem.href!);
                    navigate({ to: sidenavItem.href! });
                  }}
                />
              );
            })}
          </SideNavSection>
        </SideNav>
      }
    >
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </AppShell>
  );
}
