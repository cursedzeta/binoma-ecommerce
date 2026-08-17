import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminLogin from "./AdminLogin";

/**
 * Puerta del panel: sin sesión válida, muestra el login.
 *
 * Esto es comodidad de interfaz, no seguridad. Quien de verdad protege los
 * datos es el backend: aunque alguien forzara este componente a renderizar el
 * panel, cada petición a /api/admin/* seguiría necesitando un token válido y
 * volvería con 401.
 */
export default function AdminLayout() {
  const { token, verificando, logout } = useAuth();

  if (verificando) {
    return (
      <main className="mx-auto max-w-sm px-6 py-20 text-neutral-600">
        Verificando sesión...
      </main>
    );
  }

  if (!token) return <AdminLogin />;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-neutral-900">Panel de BINOMA</h1>
          <nav className="mt-2 flex gap-4 text-sm">
            <Solapa to="/admin">Pedidos</Solapa>
            <Solapa to="/admin/productos">Productos</Solapa>
          </nav>
        </div>
        <button onClick={logout} className="text-sm text-neutral-600 underline">
          Cerrar sesión
        </button>
      </header>

      <div className="mt-8">
        <Outlet />
      </div>
    </main>
  );
}

function Solapa({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      // "end" evita que /admin quede marcada mientras estás en /admin/productos:
      // sin eso, las dos solapas aparecerían activas a la vez.
      end={to === "/admin"}
      className={({ isActive }) =>
        isActive
          ? "border-b-2 border-neutral-900 pb-1 text-neutral-900"
          : "border-b-2 border-transparent pb-1 text-neutral-600 hover:text-neutral-900"
      }
    >
      {children}
    </NavLink>
  );
}
