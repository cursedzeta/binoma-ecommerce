import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSesion, login as loginRequest, setTokenAdmin } from "../services/api";

// Sesion del administrador.
//
// El token se guarda en localStorage. Es la opcion simple y tiene un costo
// conocido: si alguien lograra inyectar javascript en la pagina, podria leerlo.
// La alternativa (una cookie httpOnly) es mas segura pero necesita que el
// backend maneje cookies y CSRF. Para un panel de una sola persona, el cambio
// no se justifica todavia; queda anotado para cuando el panel crezca.
const STORAGE_KEY = "binoma:admin-token";

type AuthContextValue = {
  token: string | null;
  /** true mientras verificamos la sesion guardada al cargar la pagina. */
  verificando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function leerTokenGuardado(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(leerTokenGuardado);
  const [verificando, setVerificando] = useState(Boolean(token));

  // El token viaja en cada request desde el service, no desde cada componente.
  useEffect(() => {
    setTokenAdmin(token);
  }, [token]);

  // Un token guardado puede estar vencido o haber quedado invalido si cambio el
  // JWT_SECRET del servidor. Lo comprobamos contra la API antes de mostrar el
  // panel, para no dar una falsa sensacion de sesion activa.
  useEffect(() => {
    if (!token) {
      setVerificando(false);
      return;
    }

    let vigente = true;
    setTokenAdmin(token);

    getSesion()
      .then(() => {
        if (vigente) setVerificando(false);
      })
      .catch(() => {
        if (!vigente) return;
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setVerificando(false);
      });

    return () => {
      vigente = false;
    };
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const nuevo = await loginRequest(email, password);
    try {
      localStorage.setItem(STORAGE_KEY, nuevo);
    } catch {
      // Modo incognito: la sesion funciona igual, pero no sobrevive a un refresh.
    }
    setToken(nuevo);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nada que hacer: igual limpiamos la sesion en memoria.
    }
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, verificando, login, logout }),
    [token, verificando, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth tiene que usarse dentro de <AuthProvider>");
  }

  return context;
}
