import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Las fuentes se sirven desde nuestro propio dominio, no desde Google: sin
// request a terceros y sin parpadeo. Van antes del CSS para que las reglas
// @font-face existan cuando Tailwind aplique font-family.
import "@fontsource-variable/manrope";

import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
