import React from "react";
import ReactDOM from "react-dom/client";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import { Theme } from "@astryxdesign/core/theme";
import App from "./App";
import { neutralTheme } from "./theme/neutralTheme";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Theme theme={neutralTheme}>
      <App />
    </Theme>
  </React.StrictMode>,
);
