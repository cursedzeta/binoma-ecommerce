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
          <BannerProductos />

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

          <div className="mt-12 flex justify-center">
            <BotonLink to="/catalogo" variante="secundario">
              Ver todo el catálogo
            </BotonLink>
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
            <BotonLink to="/catalogo">Ver el catálogo</BotonLink>
          </div>
        </div>
      </Contenedor>
    </section>
  );
}

/**
 * Banner del bloque de productos.
 *
 * Por ahora es tipográfico sobre un fondo cálido. Cuando llegue la foto, se
 * reemplaza el degradado por la imagen y el texto queda encima: la estructura
 * ya está lista para eso.
 */
function BannerProductos() {
  return (
    <div className="relative overflow-hidden rounded-pieza border border-borde bg-superficie-2">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-marca/10 via-transparent to-transparent"
      />
      <div className="relative flex flex-col gap-2 px-6 py-10 sm:px-10 sm:py-14">
        <Etiqueta>Destacados</Etiqueta>
        <h2 className="text-titulo text-tinta">Productos</h2>
        <p className="max-w-md text-tenue">
          Una selección de lo que hay disponible ahora mismo.
        </p>
      </div>
    </div>
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
