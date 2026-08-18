import { Link } from "react-router-dom";

// Piezas compartidas del sistema de diseño.
//
// Existen para que ninguna pantalla escriba colores sueltos. Si un botón se ve
// distinto en dos páginas, es porque alguien no usó estas piezas, y eso se
// nota en la revisión.

type Variante = "primario" | "secundario" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  // Texto oscuro sobre el naranja, no blanco: blanco sobre #FF7F00 no llega
  // a contraste AA y se vuelve ilegible al sol, que es donde más se mira un
  // teléfono.
  primario:
    "bg-marca text-sobre-marca hover:brightness-95 disabled:bg-superficie-2 disabled:text-tenue",
  secundario:
    "border border-tinta text-tinta hover:bg-superficie-2 disabled:border-borde disabled:text-tenue",
  fantasma: "text-tenue hover:text-tinta",
};

const BASE =
  "group/boton inline-flex items-center justify-center gap-2.5 rounded-pieza px-6 py-3 text-sm font-medium transition disabled:cursor-not-allowed";

/** Flecha que acompaña a las llamadas a la acción y se corre al pasar el mouse. */
export function FlechaCta() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="transition-transform duration-200 group-hover/boton:translate-x-0.5"
    >
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9.8 12h4.6m0 0-1.8-1.9m1.8 1.9-1.8 1.9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Boton({
  variante = "primario",
  flecha = false,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  flecha?: boolean;
}) {
  return (
    <button className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props}>
      {children}
      {flecha && <FlechaCta />}
    </button>
  );
}

export function BotonLink({
  variante = "primario",
  flecha = false,
  className = "",
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variante?: Variante; flecha?: boolean }) {
  return (
    <Link className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props}>
      {children}
      {flecha && <FlechaCta />}
    </Link>
  );
}

/**
 * Para saltos dentro de la misma página (#catalogo).
 *
 * Un <Link> de React Router no sirve acá: intentaría navegar a una ruta en vez
 * de desplazar la página hasta el ancla.
 */
export function BotonAncla({
  variante = "primario",
  flecha = false,
  className = "",
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variante?: Variante;
  flecha?: boolean;
}) {
  return (
    <a className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props}>
      {children}
      {flecha && <FlechaCta />}
    </a>
  );
}

/** Enlace de texto con flecha, para acciones secundarias que no piden un botón. */
export function EnlaceFlecha({
  className = "",
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={`group/boton inline-flex items-center gap-2 text-sm text-tinta underline-offset-4 transition hover:text-marca-texto ${className}`}
      {...props}
    >
      {children}
      <FlechaCta />
    </Link>
  );
}

/** Etiqueta chica en mayúsculas: categorías, estados, encabezados de sección. */
export function Etiqueta({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`text-xs uppercase tracking-[0.14em] text-tenue ${className}`}>
      {children}
    </span>
  );
}

/** Recuadro para avisos que no son errores. */
export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-pieza border-l-2 border-alerta bg-alerta-suave px-4 py-3 text-sm"
    >
      {children}
    </div>
  );
}

/** Campo de formulario con su etiqueta y su texto de ayuda. */
export function Campo({
  label,
  ayuda,
  className = "",
  children,
}: {
  label: string;
  ayuda?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-tinta">{label}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-tenue">{ayuda}</span>}
    </label>
  );
}

/** Clase compartida por inputs, textareas y selects. */
export const entrada =
  "mt-1.5 w-full rounded-pieza border border-borde bg-superficie px-3 py-2.5 text-tinta placeholder:text-tenue focus:border-marca focus:outline-none";

/**
 * Contenedor de página: ancho máximo y aire lateral, iguales en todo el sitio.
 *
 * Los valores salen de los tokens --container-* y --spacing-gutter*, así que
 * cambiar el ancho o el aire del sitio entero se hace en el CSS, no acá.
 */
export function Contenedor({
  ancho = "normal",
  className = "",
  children,
}: {
  ancho?: "normal" | "angosto";
  className?: string;
  children: React.ReactNode;
}) {
  const max = ancho === "angosto" ? "max-w-angosto" : "max-w-normal";
  return (
    <div className={`mx-auto ${max} px-gutter sm:px-gutter-lg ${className}`}>
      {children}
    </div>
  );
}
