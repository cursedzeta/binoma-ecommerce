import CarruselProductos from "../components/CarruselProductos";
import TilesCategorias from "../components/TilesCategorias";
import { BotonLink, Contenedor, EnlaceFlecha, Etiqueta } from "../components/ui";
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

      <Seccion
        etiqueta="Explorá"
        titulo="¿Qué estás buscando?"
        descripcion="Cada pieza se hace en el taller, en fenólico de 18mm."
      >
        {products && <TilesCategorias products={products} />}
        {loading && <EsqueletoTiles />}
      </Seccion>

      <Seccion
        etiqueta="Destacados"
        titulo="Productos"
        accion={{ to: "/catalogo", texto: "Ver todo el catálogo" }}
      >
        {loading && <EsqueletoTarjetas />}

        {error && (
          <p className="rounded-pieza border border-borde bg-superficie p-5 text-tenue">
            No pudimos cargar los productos: {error}
          </p>
        )}

        {products && destacados.length === 0 && (
          <p className="py-12 text-center text-tenue">Todavía no hay piezas cargadas.</p>
        )}

        {destacados.length > 0 && <CarruselProductos products={destacados} />}
      </Seccion>

      <Historia />
    </>
  );
}

/**
 * Hero sin fotografía.
 *
 * El fondo son láminas horizontales finas: es el canto del fenólico visto de
 * costado, la firma del material con el que trabaja BINOMA. Se dibuja con un
 * repeating-linear-gradient, así que no pesa nada y escala sin pixelarse.
 *
 * Cuando exista la fotografía de producto, esta sección es la primera que
 * conviene reemplazar: una foto buena vende más que cualquier textura.
 */
function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-borde">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.55] dark:opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, var(--color-superficie-2) 0px, var(--color-superficie-2) 3px, transparent 3px, transparent 11px)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[560px] w-[900px] max-w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-marca opacity-[0.09] blur-3xl"
      />
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

          <p className="mt-10 text-subtitulo text-tenue">Muebles de diseño en fenólico</p>

          <h1 className="mt-3 max-w-3xl text-display uppercase text-tinta">
            Hecho en Córdoba, pieza por pieza
          </h1>

          <p className="mt-6 max-w-xl text-tenue">
            Líneas puras, estructuras autoportantes, cantos vistos y terminación al agua.
          </p>

          <div className="mt-10">
            <BotonLink to="/catalogo" flecha>
              Ver el catálogo
            </BotonLink>
          </div>
        </div>
      </Contenedor>
    </section>
  );
}

/** Bloque de marca, al final de la Home: cuenta quién hace los muebles. */
function Historia() {
  return (
    <section className="border-t border-borde bg-superficie-2/60 py-20 sm:py-28">
      <Contenedor ancho="angosto" className="text-center">
        <Etiqueta>El taller</Etiqueta>
        <h2 className="mt-3 text-titulo text-tinta">
          Muebles que se piensan antes de cortarse
        </h2>
        <p className="mx-auto mt-6 max-w-xl leading-relaxed text-tenue">
          Trabajamos el fenólico por lo que es: una madera honesta, que muestra sus
          capas en el canto y no necesita esconderse detrás de un revestimiento. Cada
          pieza se arma sin herrajes a la vista, para que lo que se vea sea la madera y
          la línea.
        </p>
        <div className="mt-8 flex justify-center">
          <EnlaceFlecha to="/catalogo">Ver las piezas</EnlaceFlecha>
        </div>
      </Contenedor>
    </section>
  );
}

function Seccion({
  etiqueta,
  titulo,
  descripcion,
  accion,
  children,
}: {
  etiqueta: string;
  titulo: string;
  descripcion?: string;
  accion?: { to: string; texto: string };
  children: React.ReactNode;
}) {
  return (
    <section className="py-16 sm:py-20">
      <Contenedor>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-borde pb-6">
          <div>
            <Etiqueta>{etiqueta}</Etiqueta>
            <h2 className="mt-1 text-titulo text-tinta">{titulo}</h2>
            {descripcion && <p className="mt-2 max-w-md text-tenue">{descripcion}</p>}
          </div>
          {accion && <EnlaceFlecha to={accion.to}>{accion.texto}</EnlaceFlecha>}
        </div>
        <div className="mt-10">{children}</div>
      </Contenedor>
    </section>
  );
}

function EsqueletoTiles() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i}>
          <div className="aspect-3/4 animate-pulse rounded-pieza bg-superficie-2" />
          <div className="mt-3 h-5 w-24 animate-pulse rounded bg-superficie-2" />
        </div>
      ))}
    </div>
  );
}

function EsqueletoTarjetas() {
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
