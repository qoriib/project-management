import React from "react";
import ReactDOM from "react-dom/client";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import "@astryxdesign/theme-neutral/theme.css";

import { RouterProvider, createRouter, createHashHistory } from '@tanstack/react-router';
// Import the generated route tree
import { routeTree } from '@/routeTree.gen';

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
