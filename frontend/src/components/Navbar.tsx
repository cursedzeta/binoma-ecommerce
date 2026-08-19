import { useEffect, useRef, useState } from "react";
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

/**
 * ¿La barra está apoyada sobre el hero naranja?
 *
 * El problema es que la barra vive en el layout, por encima de todas las rutas,
 * y el hero vive dentro de la Home. Una no puede leer el estado de la otra sin
 * armar un contexto que atraviese medio árbol.
 *
 * La salida es al revés: la Home marca con `data-fin-hero` el punto donde
 * termina el naranja, y la barra lo busca en el documento. Mientras esa marca
 * esté por debajo del borde de abajo de la barra, hay naranja atrás. En las
 * páginas sin hero no hay marca, `sobreHero` queda en false y la barra se pinta
 * como siempre, sin que nadie tenga que avisarle.
 *
 * El límite se mide del alto real de la barra en vez de escribir 72px: mide
 * distinto en mobile que en escritorio, y un número fijo se desincroniza la
 * próxima vez que alguien le toque el padding.
 */
function useSobreHero(barra: React.RefObject<HTMLElement | null>) {
  const [sobreHero, setSobreHero] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    let encolado = 0;

    function medir() {
      const marca = document.querySelector("[data-fin-hero]");
      const limite = barra.current?.getBoundingClientRect().bottom ?? 0;
      setSobreHero(!!marca && marca.getBoundingClientRect().top > limite);
    }

    // El scroll avisa decenas de veces por segundo. Sin esto, cada aviso
    // mediría el DOM y pediría un render: la barra parpadearía y el scroll se
    // sentiría pesado. Con requestAnimationFrame se mide una vez por cuadro,
    // que es todo lo que la pantalla llega a mostrar.
    function alMoverse() {
      if (encolado) return;
      encolado = requestAnimationFrame(() => {
        encolado = 0;
        medir();
      });
    }

    medir();
    window.addEventListener("scroll", alMoverse, { passive: true });
    window.addEventListener("resize", alMoverse);

    return () => {
      cancelAnimationFrame(encolado);
      window.removeEventListener("scroll", alMoverse);
      window.removeEventListener("resize", alMoverse);
    };
    // Al cambiar de página hay que volver a medir: la marca puede aparecer o
    // desaparecer, y navegar no mueve el scroll.
  }, [barra, pathname]);

  return sobreHero;
}

export default function Navbar() {
  const { totalItems } = useCart();
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  const barra = useRef<HTMLElement>(null);

  // Con el menú mobile desplegado la barra lleva fondo propio, así que deja de
  // comportarse como si estuviera sobre el naranja aunque lo esté.
  const sobreHero = useSobreHero(barra) && !abierto;

  // Al navegar, el menú se cierra solo. Sin esto queda abierto tapando la
  // página nueva, que es el error más común de un menú hamburguesa.
  useEffect(() => setAbierto(false), [pathname]);

  return (
    <header
      ref={barra}
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        sobreHero
          ? "border-transparent bg-transparent"
          : "border-borde bg-fondo/80 backdrop-blur-md"
      }`}
    >
      <Contenedor>
        {/* Tres columnas para poder centrar el logo de verdad: las de los
            costados valen 1fr cada una, así que el medio cae en el centro
            exacto de la barra aunque a la izquierda haya dos enlaces y a la
            derecha tres iconos.

            Con flex no alcanzaba: el logo habría quedado en el centro del
            espacio que sobra, que se corre según cuánto ocupe cada lado. */}
        <nav className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 sm:h-18">
          <div className="flex items-center gap-7">
            {/* En mobile el menú pasa a la izquierda: es el lugar que dejó
                libre el logo al irse al centro. */}
            <button
              type="button"
              onClick={() => setAbierto((a) => !a)}
              aria-expanded={abierto}
              aria-controls="menu-mobile"
              aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
              className={`-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-pieza transition md:hidden ${
                sobreHero
                  ? "text-sobre-hero hover:bg-sobre-hero/15"
                  : "text-tenue hover:bg-superficie-2 hover:text-tinta"
              }`}
            >
              {abierto ? <IconoCerrar /> : <IconoMenu />}
            </button>

            <div className="hidden items-center gap-7 md:flex">
              {ENLACES.map((e) => (
                <Enlace key={e.to} to={e.to} sobreHero={sobreHero}>
                  {e.texto}
                </Enlace>
              ))}
            </div>
          </div>

          <Link
            to="/"
            aria-label="BINOMA, ir al inicio"
            className="justify-self-center"
          >
            <img
              src="/binoma_logo.svg"
              alt="BINOMA"
              width={1073}
              height={225}
              // brightness-0 lo pinta de negro e invert lo pasa a blanco: el
              // mismo archivo sirve para los dos fondos.
              className={`h-5 w-auto sm:h-6 ${sobreHero ? "brightness-0 invert" : ""}`}
            />
          </Link>

          <div className="flex items-center justify-end gap-1">
            <BotonTema sobreHero={sobreHero} />
            <EnlaceCarrito total={totalItems} sobreHero={sobreHero} />
          </div>
        </nav>
      </Contenedor>

      {abierto && (
        <div id="menu-mobile" className="border-t border-borde bg-fondo md:hidden">
          <Contenedor>
            <div className="flex flex-col divide-y divide-borde">
              {ENLACES.map((e) => (
                <Enlace key={e.to} to={e.to} sobreHero={false} className="py-4">
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
  sobreHero = false,
  className = "",
  children,
}: {
  to: string;
  sobreHero?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        // El color se arma acá adentro y no se pisa desde afuera con otra
        // clase: dos utilidades de color en el mismo elemento las decide el
        // orden del CSS generado, no el orden en que se escriben.
        `relative text-sm transition ${
          sobreHero
            ? isActive
              ? "font-medium text-sobre-hero"
              : "text-sobre-hero/75 hover:text-sobre-hero"
            : isActive
              ? "font-medium text-tinta"
              : "text-tenue hover:text-tinta"
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
              className={`absolute -bottom-1.5 left-0 hidden h-0.5 w-full md:block ${
                sobreHero ? "bg-sobre-hero" : "bg-marca"
              }`}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

function EnlaceCarrito({ total, sobreHero }: { total: number; sobreHero: boolean }) {
  return (
    <Link
      to="/carrito"
      aria-label={`Carrito, ${total} ${total === 1 ? "producto" : "productos"}`}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-pieza transition ${
        sobreHero
          ? "text-sobre-hero hover:bg-sobre-hero/15"
          : "text-tenue hover:bg-superficie-2 hover:text-tinta"
      }`}
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
        <span
          className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
            // Sobre el naranja un globito naranja no se vería. Invertido:
            // blanco con el número en naranja oscuro.
            sobreHero ? "bg-sobre-hero text-marca-texto" : "bg-marca text-sobre-marca"
          }`}
        >
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
