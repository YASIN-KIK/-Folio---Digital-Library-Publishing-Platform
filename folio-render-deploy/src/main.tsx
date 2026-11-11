import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppErrorBoundary } from "./components/ui/app-error-boundary";
import { DataAccessGate } from "./components/ui/data-access-gate";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
      <DataAccessGate />
    </AppErrorBoundary>
  </React.StrictMode>
);
