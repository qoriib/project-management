import React from "react";
import ReactDOM from "react-dom/client";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { routeTree } from "@/routeTree.gen";
import { RouterProvider, createHashHistory, createRouter } from "@tanstack/react-router";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-neutral/theme.css";
import { useAppStore } from "@/store/useAppStore";

// Create a new router instance
const hashHistory = createHashHistory(),
  router = createRouter({ history: hashHistory, routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/** Inner component that reads themeMode from the store and passes it to <Theme>. */
function ThemedApp() {
  const themeMode = useAppStore((s) => s.themeMode);
  return (
    <Theme theme={neutralTheme} mode={themeMode}>
      <RouterProvider router={router} />
    </Theme>
  );
}

ReactDOM.createRoot(document.querySelector("#root") as HTMLElement).render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>,
);
