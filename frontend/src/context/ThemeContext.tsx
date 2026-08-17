import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Modo claro / oscuro.
//
// Tres estados posibles, no dos: el usuario puede elegir claro, oscuro, o no
// elegir nada. Sin elección, seguimos lo que tenga configurado su sistema
// operativo, y si más tarde lo cambia ahí, el sitio lo acompaña.

const STORAGE_KEY = "binoma:tema";

export type Tema = "claro" | "oscuro";

type ThemeContextValue = {
  tema: Tema;
  /** true si el tema viene del sistema porque el usuario no eligió. */
  siguiendoAlSistema: boolean;
  alternar: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function leerPreferenciaGuardada(): Tema | null {
  try {
    const valor = localStorage.getItem(STORAGE_KEY);
    return valor === "claro" || valor === "oscuro" ? valor : null;
  } catch {
    return null;
  }
}

function preferenciaDelSistema(): Tema {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [elegido, setElegido] = useState<Tema | null>(leerPreferenciaGuardada);
  const [delSistema, setDelSistema] = useState<Tema>(preferenciaDelSistema);

  const tema = elegido ?? delSistema;

  // Si el usuario no eligió, seguimos al sistema en vivo: cambia el tema del
  // sistema operativo y el sitio cambia con él, sin recargar.
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = (e: MediaQueryListEvent) => setDelSistema(e.matches ? "oscuro" : "claro");

    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  // La clase en <html> es lo que hace efecto: todos los tokens del CSS se
  // redefinen bajo .dark.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "oscuro");
    // Le avisa al navegador para que pinte los controles nativos (scrollbars,
    // campos de formulario) del color correcto.
    document.documentElement.style.colorScheme = tema === "oscuro" ? "dark" : "light";
  }, [tema]);

  const alternar = useCallback(() => {
    setElegido((actual) => {
      const nuevo: Tema = (actual ?? preferenciaDelSistema()) === "oscuro" ? "claro" : "oscuro";
      try {
        localStorage.setItem(STORAGE_KEY, nuevo);
      } catch {
        // Modo incógnito: el tema funciona igual, pero no sobrevive al refresh.
      }
      return nuevo;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ tema, siguiendoAlSistema: elegido === null, alternar }),
    [tema, elegido, alternar],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTema() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTema tiene que usarse dentro de <ThemeProvider>");
  }

  return context;
}
