import React from "react";
import ReactDOM from "react-dom/client";
import { Theme } from "@astryxdesign/core/theme";
import { appTheme } from "./theme";
import { routeTree } from "@/routeTree.gen";
import { RouterProvider, createHashHistory, createRouter } from "@tanstack/react-router";
import { useAppStore } from "@/store/useAppStore";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

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

/** Inner component that reads themeMode from the store and passes appTheme to <Theme>. */
function ThemedApp() {
  const themeMode = useAppStore((state) => state.themeMode);

  return (
    <Theme theme={appTheme} mode={themeMode}>
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
