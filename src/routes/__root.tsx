import { Outlet, createRootRoute, redirect, useLocation } from "@tanstack/react-router";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AppShell, useToast } from "@astryxdesign/core";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { getDB } from "@/db";
import { useAppStore } from "@/store/useAppStore";
import { useMasterStore } from "@/store/useMasterStore";
import { APP, getUserRole } from "@/configs/app.config";
import { checkIsAuthenticated } from "@/db/services/auth.service";
import { AppSideNav } from "@/components/shared/AppSideNav";
import { LoadingState } from "@/components/shared/LoadingState";

function RootComponent() {
  const location = useLocation();

  if (location.pathname === "/login") {
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
  const location = useLocation();
  const userRole = getUserRole();
  const showToast = useToast();

  const { setActiveNav, dbReady, setDbReady } = useAppStore(
    useShallow((s) => ({
      dbReady: s.dbReady,
      setActiveNav: s.setActiveNav,
      setDbReady: s.setDbReady,
    })),
  );

  useEffect(() => {
    setActiveNav(location.pathname);
  }, [location.pathname, setActiveNav]);

  useEffect(() => {
    const title = `${APP.title} - ${userRole}`;
    try {
      getCurrentWindow().setTitle(title).catch(() => {});
    } catch {}
  }, [userRole]);

  useEffect(() => {
    getDB()
      .then(() => {
        setDbReady(true);
        useMasterStore.getState().loadAllMasters();
      })
      .catch((error) => {
        console.error("DB init failed:", error);
        showToast({
          type: "error",
          body: "Gagal membuka database.",
        });
        setDbReady(true); // Allow UI to render in dev mode
      });
  }, [setDbReady, showToast]);

  if (!dbReady) {
    return <LoadingState message="Memuat database…" />;
  }

  return (
    <AppShell height="fill" variant="elevated" sideNav={<AppSideNav />}>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </AppShell>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: ({ location }) => {
    if (!checkIsAuthenticated() && location.pathname !== "/login") {
      throw redirect({
        to: "/login",
      });
    }
  },
});
