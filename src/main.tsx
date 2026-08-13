import React from "react";
import ReactDOM from "react-dom/client";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { routeTree } from '@/routeTree.gen';
import { RouterProvider, createRouter, createHashHistory } from '@tanstack/react-router';
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-neutral/theme.css";

// Create a new router instance
const hashHistory = createHashHistory();
const router = createRouter({ routeTree, history: hashHistory });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Theme theme={neutralTheme}>
      <RouterProvider router={router} />
    </Theme>
  </React.StrictMode>,
);
