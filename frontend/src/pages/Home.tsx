import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { BotonAncla, Contenedor, Etiqueta } from "../components/ui";
import { useProducts } from "../hooks/useProducts";

export default function Home() {
  const [categoria, setCategoria] = useState<string | undefined>(undefined);

  // Traemos el catálogo entero una sola vez y filtramos en el navegador. Las
  // categorías salen de los productos que existen, así una categoría nueva
  // cargada desde el panel aparece sola en los filtros.
  const { data: todos, loading, error } = useProducts();

  const categorias = useMemo(
    () => [...new Set((todos ?? []).map((p) => p.category))].sort(),
    [todos],
  );

  const products = useMemo(
    () => (categoria ? (todos ?? []).filter((p) => p.category === categoria) : todos),
    [todos, categoria],
  );

  return (
    <>
      <Hero />

      <section id="catalogo" className="scroll-mt-20 pb-24">
        <Contenedor>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-borde pb-5">
            <div>
              <Etiqueta>Catálogo</Etiqueta>
              <h2 className="mt-1 text-titulo text-tinta">Piezas disponibles</h2>
            </div>

            {categorias.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Filtro activo={!categoria} onClick={() => setCategoria(undefined)}>
                  Todo
                </Filtro>
                {categorias.map((c) => (
                  <Filtro key={c} activo={categoria === c} onClick={() => setCategoria(c)}>
                    {c}
                  </Filtro>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            {loading && <Esqueleto />}

            {error && (
              <p className="rounded-pieza border border-borde bg-superficie p-5 text-tenue">
                No pudimos cargar el catálogo: {error}
              </p>
            )}

            {products && products.length === 0 && (
              <p className="py-12 text-center text-tenue">
                No hay piezas en esta categoría.
              </p>
            )}

            {products && products.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </Contenedor>
      </section>
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-borde">
      {/* Halo cálido detrás del logo. Es sutil a propósito: da profundidad sin
          competir con el naranja de la marca. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] max-w-[130%] -translate-x-1/2 -translate-y-1/3 rounded-full bg-marca opacity-[0.07] blur-3xl"
      />

      <Contenedor className="relative">
        <div className="flex flex-col items-center py-20 text-center sm:py-28">
          <img
            src="/binoma_logo.svg"
            alt="BINOMA"
            width={1073}
            height={225}
            className="w-full max-w-md"
          />

          <h1 className="mt-10 max-w-2xl text-display text-tinta">
            Muebles de diseño en fenólico
          </h1>

          <p className="mt-5 max-w-xl text-subtitulo text-tenue">
            Piezas de líneas puras, hechas en Córdoba. Estructuras autoportantes,
            cantos vistos y terminación al agua.
          </p>

          <div className="mt-10">
            <BotonAncla href="#catalogo">Ver el catálogo</BotonAncla>
          </div>
        </div>
      </Contenedor>
    </section>
  );
}

function Filtro({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`rounded-pieza border px-3.5 py-1.5 text-sm capitalize transition ${
        activo
          ? "border-marca bg-marca-suave text-marca-texto"
          : "border-borde text-tenue hover:border-tenue hover:text-tinta"
      }`}
    >
      {children}
    </button>
  );
}

/** Bloques grises del tamaño de las tarjetas: evita que la página salte cuando
    llegan los productos. */
function Esqueleto() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="rounded-pieza border border-borde bg-superficie">
          <div className="aspect-4/3 animate-pulse bg-superficie-2" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-16 animate-pulse rounded bg-superficie-2" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-superficie-2" />
            <div className="h-4 w-24 animate-pulse rounded bg-superficie-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
