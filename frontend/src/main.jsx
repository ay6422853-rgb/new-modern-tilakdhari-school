import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/main.css";

import { AuthProvider } from "./context/AuthContext";
import RoutesFor from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure index.html contains <div id="root"></div>.'
  );
}

createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RoutesFor />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);