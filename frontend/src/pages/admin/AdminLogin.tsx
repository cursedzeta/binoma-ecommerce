import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../services/api";

export default function AdminLogin() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      await login(email, password);
      // No hace falta navegar: al haber token, AdminLayout muestra el panel.
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo conectar con el servidor. Probá de nuevo.",
      );
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-2xl text-tinta">BINOMA</h1>
      <p className="mt-1 text-sm text-tenue">Panel de administración</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm text-tenue">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            className="mt-1 w-full border border-borde px-3 py-2 text-tinta focus:border-tinta focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-tenue">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1 w-full border border-borde px-3 py-2 text-tinta focus:border-tinta focus:outline-none"
          />
        </div>

        {error && (
          <p role="alert" className="border border-borde p-3 text-sm text-tinta">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full border border-tinta px-6 py-3 text-tinta disabled:border-borde disabled:text-tenue"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
