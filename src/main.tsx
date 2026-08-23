import React from "react";
import ReactDOM from "react-dom/client";
import { Theme } from "@astryxdesign/core/theme";
import { stoneTheme } from "./themes/stone/stoneTheme";
import { routeTree } from "@/routeTree.gen";
import { RouterProvider, createHashHistory, createRouter } from "@tanstack/react-router";
import { useAppStore } from "@/store/useAppStore";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "./app.css";

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Create a new router instance
const hashHistory = createHashHistory();
const router = createRouter({ history: hashHistory, routeTree });

/** Inner component that reads themeMode from the store and passes it to <Theme>. */
function ThemedApp() {
  const themeMode = useAppStore((s) => s.themeMode);

  return (
    <Theme theme={stoneTheme} mode={themeMode}>
      <InternationalizationProvider
        locale="en"
        overrides={{
          en: {
            "@astryx.field.required": "*",
          },
        }}
      >
        <RouterProvider router={router} />
      </InternationalizationProvider>
    </Theme>
  );
}

ReactDOM.createRoot(document.querySelector("#root") as HTMLElement).render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>,
);
