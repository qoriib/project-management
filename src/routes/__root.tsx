import { createRootRoute, Outlet, useNavigate, useLocation, redirect } from '@tanstack/react-router';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AppShell, SideNav, SideNavSection, SideNavItem, SideNavHeading, Text, VStack, Heading } from "@astryxdesign/core";
import { useEffect } from "react";
import { useShallow } from 'zustand/react/shallow';
import { getDB } from "@/db";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { APP, AppRole } from '@/configs/app.config';
import { checkIsAuthenticated } from '@/services/auth';

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: ({ location }) => {
    if (!checkIsAuthenticated() && location.pathname !== '/login') {
      throw redirect({
        to: '/login',
      })
    }
  },
});

function RootComponent() {
  const location = useLocation();

  if (location.pathname === '/login') {
    return (
      <>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
      </>
    );
  }

  return <AppLayout />;
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const envRole = import.meta.env.VITE_APP_ROLE?.toUpperCase() || 'MANAGER';
  const roleKey = envRole as keyof typeof AppRole;
  const userRole = AppRole[roleKey] || AppRole.MANAGER;

  const {
    activeNav,
    setActiveNav,
    dbReady,
    setDbReady,
    setGlobalError,
    selectedProjectId,
  } = useAppStore(
    useShallow((s) => ({
      activeNav: s.activeNav,
      setActiveNav: s.setActiveNav,
      dbReady: s.dbReady,
      setDbReady: s.setDbReady,
      setGlobalError: s.setGlobalError,
      selectedProjectId: s.selectedProjectId,
    }))
  );

  const projects = useMasterStore((state) => state.projects);
  const activeProject = projects.find(p => p.project_id === selectedProjectId);

  // Sync activeNav with the current route (supports direct URL hits / refresh)
  useEffect(() => {
    setActiveNav(location.pathname);
  }, [location.pathname, setActiveNav]);

  useEffect(() => {
    const title = `${APP.title} - ${userRole}`;
    try {
      getCurrentWindow().setTitle(title);
    } catch (e) {
      // Fallback if running outside Tauri
      document.title = title;
    }
  }, [userRole]);

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
              subheading={activeProject ? `${activeProject.company_name} - ${activeProject.fiscal_year}` : "Pilih Proyek di Master Data"}
            />
          }
          footer={
            <VStack paddingInline={2}>
              <Text weight="normal" color="secondary">{userRole}</Text>
              <Heading level={3}>{APP.companyName}</Heading>
            </VStack>
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
