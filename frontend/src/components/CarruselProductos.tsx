import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "../types";
import ProductCard from "./ProductCard";

/**
 * Carrusel de productos, de a dos por vista.
 *
 * Está hecho con scroll nativo y scroll-snap, no con transforms: así funciona
 * el gesto de arrastrar en el teléfono y la rueda del mouse sin escribir una
 * línea de JavaScript para eso. Las flechas solo empujan el scroll.
 *
 * En mobile va de a uno: dos tarjetas en 360px de ancho quedan ilegibles, y la
 * foto del producto es justamente lo que hay que mirar.
 */
export default function CarruselProductos({ products }: { products: Product[] }) {
  const pista = useRef<HTMLDivElement>(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);

  const revisarBordes = useCallback(() => {
    const el = pista.current;
    if (!el) return;

    // El margen de 4px evita que la flecha quede habilitada por un pixel de
    // redondeo cuando ya llegaste al final.
    setPuedeIzq(el.scrollLeft > 4);
    setPuedeDer(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    revisarBordes();
    window.addEventListener("resize", revisarBordes);
    return () => window.removeEventListener("resize", revisarBordes);
  }, [revisarBordes, products.length]);

  function mover(direccion: -1 | 1) {
    const el = pista.current;
    if (!el) return;
    // Avanza exactamente una vista, sea de una o de dos tarjetas.
    el.scrollBy({ left: direccion * el.clientWidth, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={pista}
        onScroll={revisarBordes}
        // El tabIndex hace que la pista sea alcanzable con teclado: quien no usa
        // mouse puede desplazarla con las flechas del teclado.
        tabIndex={0}
        role="region"
        aria-label="Productos destacados"
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="w-full shrink-0 snap-start sm:w-[calc(50%-0.625rem)]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      <Flecha lado="izq" onClick={() => mover(-1)} disabled={!puedeIzq} />
      <Flecha lado="der" onClick={() => mover(1)} disabled={!puedeDer} />
    </div>
  );
}

function Flecha({
  lado,
  onClick,
  disabled,
}: {
  lado: "izq" | "der";
  onClick: () => void;
  disabled: boolean;
}) {
  const esIzq = lado === "izq";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={esIzq ? "Ver productos anteriores" : "Ver más productos"}
      className={`absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-borde bg-fondo text-tinta shadow-sm transition hover:border-marca hover:text-marca-texto disabled:pointer-events-none disabled:opacity-0 sm:flex ${
        esIzq ? "-left-5" : "-right-5"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d={esIzq ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
