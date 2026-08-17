import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import BotonTema from "./BotonTema";
import { Contenedor } from "./ui";

// Cuando exista la página Nosotros (sprint 6, con la cross-promoción de
// Zeta3), se agrega acá y aparece sola en escritorio y en el menú mobile.
const ENLACES = [
  { to: "/", texto: "Inicio" },
  { to: "/catalogo", texto: "Catálogo" },
];

export default function Navbar() {
  const { totalItems } = useCart();
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();

  // Al navegar, el menú se cierra solo. Sin esto queda abierto tapando la
  // página nueva, que es el error más común de un menú hamburguesa.
  useEffect(() => setAbierto(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-fondo/80 backdrop-blur-md">
      <Contenedor>
        <nav className="flex h-16 items-center gap-6 sm:h-18">
          <Link to="/" aria-label="BINOMA, ir al inicio" className="shrink-0">
            <img
              src="/binoma_logo.svg"
              alt="BINOMA"
              width={1073}
              height={225}
              className="h-5 w-auto sm:h-6"
            />
          </Link>

          {/* Escritorio */}
          <div className="ml-auto hidden items-center gap-7 md:flex">
            {ENLACES.map((e) => (
              <Enlace key={e.to} to={e.to}>
                {e.texto}
              </Enlace>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <BotonTema />
            <EnlaceCarrito total={totalItems} />
            <button
              type="button"
              onClick={() => setAbierto((a) => !a)}
              aria-expanded={abierto}
              aria-controls="menu-mobile"
              aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-pieza text-tenue transition hover:bg-superficie-2 hover:text-tinta md:hidden"
            >
              {abierto ? <IconoCerrar /> : <IconoMenu />}
            </button>
          </div>
        </nav>
      </Contenedor>

      {abierto && (
        <div id="menu-mobile" className="border-t border-borde bg-fondo md:hidden">
          <Contenedor>
            <div className="flex flex-col divide-y divide-borde">
              {ENLACES.map((e) => (
                <Enlace key={e.to} to={e.to} className="py-4">
                  {e.texto}
                </Enlace>
              ))}
            </div>
          </Contenedor>
        </div>
      )}
    </header>
  );
}

function Enlace({
  to,
  className = "",
  children,
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `relative text-sm transition ${
          isActive ? "font-medium text-tinta" : "text-tenue hover:text-tinta"
        } ${className}`
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {/* Subrayado corto en naranja para la sección activa. Solo en
              escritorio: en el menú desplegable el peso del texto ya alcanza. */}
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute -bottom-1.5 left-0 hidden h-0.5 w-full bg-marca md:block"
            />
          )}
        </>
      )}
    </NavLink>
  );
}

function EnlaceCarrito({ total }: { total: number }) {
  return (
    <Link
      to="/carrito"
      aria-label={`Carrito, ${total} ${total === 1 ? "producto" : "productos"}`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-pieza text-tenue transition hover:bg-superficie-2 hover:text-tinta"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 4h2.2l2 11.2a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.3L20.5 7H6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9.5" cy="20" r="1.3" fill="currentColor" />
        <circle cx="17" cy="20" r="1.3" fill="currentColor" />
      </svg>
      {total > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-marca px-1 text-[10px] font-semibold text-sobre-marca">
          {total}
        </span>
      )}
    </Link>
  );
}

function IconoMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconoCerrar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
