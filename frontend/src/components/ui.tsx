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
  "inline-flex items-center justify-center gap-2 rounded-pieza px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed";

export function Boton({
  variante = "primario",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return <button className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props} />;
}

export function BotonLink({
  variante = "primario",
  className = "",
  ...props
}: React.ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props} />;
}

/**
 * Para saltos dentro de la misma página (#catalogo).
 *
 * Un <Link> de React Router no sirve acá: intentaría navegar a una ruta en vez
 * de desplazar la página hasta el ancla.
 */
export function BotonAncla({
  variante = "primario",
  className = "",
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variante?: Variante }) {
  return <a className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props} />;
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
    <span
      className={`text-xs uppercase tracking-[0.14em] text-tenue ${className}`}
    >
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

/** Recuadro para errores. Lleva role="alert" para que lo anuncien los lectores. */
export function Error({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-pieza border border-borde bg-superficie px-4 py-3 text-sm"
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

/** Contenedor de página: ancho máximo y aire lateral, iguales en todo el sitio. */
export function Contenedor({
  ancho = "normal",
  className = "",
  children,
}: {
  ancho?: "normal" | "angosto";
  className?: string;
  children: React.ReactNode;
}) {
  const max = ancho === "angosto" ? "max-w-3xl" : "max-w-6xl";
  return <div className={`mx-auto ${max} px-5 sm:px-8 ${className}`}>{children}</div>;
}
