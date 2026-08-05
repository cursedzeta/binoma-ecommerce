import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="border-b border-neutral-300">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" className="text-lg font-semibold tracking-wide text-neutral-900">
          BINOMA
        </Link>
        <div className="flex items-center gap-6 text-sm text-neutral-600">
          <Link to="/" className="hover:text-neutral-900">
            Catálogo
          </Link>
          {/* Carrito: sprint 3 */}
          <span className="text-neutral-400">Carrito (0)</span>
        </div>
      </nav>
    </header>
  );
}
