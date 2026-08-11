import { useAuth } from "../../context/AuthContext";
import AdminLogin from "./AdminLogin";
import AdminPedidos from "./AdminPedidos";

/**
 * Puerta del panel: sin sesión válida, muestra el login.
 *
 * Esto es comodidad de interfaz, no seguridad. Quien de verdad protege los
 * datos es el backend: aunque alguien forzara este componente a renderizar el
 * panel, cada petición a /api/admin/* seguiría necesitando un token válido y
 * volvería con 401.
 */
export default function AdminLayout() {
  const { token, verificando } = useAuth();

  if (verificando) {
    return (
      <main className="mx-auto max-w-sm px-6 py-20 text-neutral-600">
        Verificando sesión...
      </main>
    );
  }

  return token ? <AdminPedidos /> : <AdminLogin />;
}
