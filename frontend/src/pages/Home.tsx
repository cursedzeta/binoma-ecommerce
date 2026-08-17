import CarruselProductos from "../components/CarruselProductos";
import { BotonLink, Contenedor, Etiqueta } from "../components/ui";
import { useProducts } from "../hooks/useProducts";

export default function Home() {
  const { data: products, loading, error } = useProducts();

  // En el carrusel van primero los que se pueden comprar: mostrar arriba de
  // todo una pieza sin stock sería empezar por una decepción.
  const destacados = (products ?? [])
    .slice()
    .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0))
    .slice(0, 8);

  return (
    <>
      <Hero />

      <section className="py-16 sm:py-24">
        <Contenedor>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-borde pb-6">
            <div>
              <Etiqueta>Destacados</Etiqueta>
              <h2 className="mt-1 text-titulo text-tinta">Productos</h2>
            </div>
            <BotonLink to="/catalogo" variante="secundario">
              Ver todo
            </BotonLink>
          </div>

          <div className="mt-10">
            {loading && <Esqueleto />}

            {error && (
              <p className="rounded-pieza border border-borde bg-superficie p-5 text-tenue">
                No pudimos cargar los productos: {error}
              </p>
            )}

            {products && destacados.length === 0 && (
              <p className="py-12 text-center text-tenue">
                Todavía no hay piezas cargadas.
              </p>
            )}

            {destacados.length > 0 && <CarruselProductos products={destacados} />}
          </div>
        </Contenedor>
      </section>
    </>
  );
}

/**
 * Hero sin fotografía.
 *
 * El fondo son láminas horizontales finas: es el canto del fenólico visto de
 * costado, que es la firma del material con el que trabaja BINOMA. Se dibuja
 * con un repeating-linear-gradient, así que no pesa nada y escala a cualquier
 * pantalla sin pixelarse.
 *
 * Cuando exista la fotografía de producto, esta sección es la primera que
 * conviene reemplazar: una foto buena vende más que cualquier textura.
 */
function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-borde">
      {/* Láminas del fenólico */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.55] dark:opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, var(--color-superficie-2) 0px, var(--color-superficie-2) 3px, transparent 3px, transparent 11px)",
        }}
      />

      {/* Halo cálido: separa el logo de la textura y le da profundidad. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[560px] w-[900px] max-w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-marca opacity-[0.09] blur-3xl"
      />

      {/* Desvanecido hacia abajo, para que las láminas no corten de golpe
          contra la sección siguiente. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-fondo"
      />

      <Contenedor className="relative">
        <div className="flex flex-col items-center py-24 text-center sm:py-32">
          <img
            src="/binoma_logo.svg"
            alt="BINOMA"
            width={1073}
            height={225}
            className="w-full max-w-lg"
          />

          <div className="mt-8 flex items-center gap-3" aria-hidden="true">
            <span className="h-px w-10 bg-borde" />
            <Etiqueta>Córdoba, Argentina</Etiqueta>
            <span className="h-px w-10 bg-borde" />
          </div>

          <h1 className="mt-8 max-w-3xl text-display text-tinta">
            Muebles de diseño en fenólico
          </h1>

          <p className="mt-6 max-w-xl text-subtitulo text-tenue">
            Piezas de líneas puras. Estructuras autoportantes, cantos vistos y
            terminación al agua.
          </p>

          <div className="mt-10">
            <BotonLink to="/catalogo">Ver el catálogo</BotonLink>
          </div>
        </div>
      </Contenedor>
    </section>
  );
}

/** Dos bloques del tamaño de las tarjetas: evita que la página salte cuando
    llegan los datos. */
function Esqueleto() {
  return (
    <div className="grid gap-5 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 2 }, (_, i) => (
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
