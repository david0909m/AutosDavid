import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.tsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("No se encontró el contenedor principal de la aplicación.");
}

// StrictMode ayuda a detectar problemas de componentes durante el desarrollo.
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
