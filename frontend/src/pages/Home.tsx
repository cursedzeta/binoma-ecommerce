import MosaicoProductos from "../components/MosaicoProductos";
import { Link } from "react-router-dom";
import { BotonLink, Contenedor, EnlaceFlecha, Etiqueta } from "../components/ui";
import { formatPrice } from "../lib/format";
import type { Product } from "../types";
import { useProducts } from "../hooks/useProducts";
import { useSincronizarCarrito } from "../hooks/useSincronizarCarrito";

export default function Home() {
  const { data: products, loading, error } = useProducts();

  // Si alguien tenía en el carrito una pieza que ya se borró del catálogo, se
  // limpia acá: el contador del navbar deja de mentir apenas entra a la tienda.
  useSincronizarCarrito(products);

  // En el carrusel van primero los que se pueden comprar: mostrar arriba de
  // todo una pieza sin stock sería empezar por una decepción.
  const destacados = (products ?? [])
    .slice()
    .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0))
    .slice(0, 6);

  return (
    <>
      <Hero destacado={destacados[0]} />

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

        {destacados.length > 0 && <MosaicoProductos products={destacados} />}
      </Seccion>

      <Historia />
    </>
  );
}

/**
 * Hero editorial: el mensaje a un lado, la pieza al otro.
 *
 * El panel de la derecha muestra la primera pieza con stock que tenga foto.
 * Si todavía no hay fotografía, cae en la textura de láminas —el canto del
 * fenólico visto de costado— en vez de dejar un hueco. Cuando cargues las
 * fotos, esta sección mejora sola sin tocar código.
 */
function Hero({ destacado }: { destacado?: Product }) {
  const foto = destacado?.images[0];

  return (
    <section className="relative isolate overflow-hidden border-b border-borde">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/2 -z-10 h-[560px] w-[720px] -translate-y-1/2 rounded-full bg-marca opacity-[0.07] blur-3xl"
      />

      <Contenedor className="relative">
        <div className="grid items-center gap-12 py-seccion sm:py-seccion-lg lg:grid-cols-2 lg:gap-16">
          <div>
            <img
              src="/binoma_logo.svg"
              alt="BINOMA"
              width={1073}
              height={225}
              className="h-7 w-auto sm:h-8"
            />

            <h1 className="mt-8 text-display uppercase text-tinta">
              Estructura honesta
            </h1>

            <p className="mt-6 max-w-md text-subtitulo text-tenue">
              Muebles de diseño en fenólico. Líneas puras, estructuras
              autoportantes y el canto a la vista, sin nada que esconder.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <BotonLink to="/catalogo" flecha>
                Ver el catálogo
              </BotonLink>
              <Etiqueta>Córdoba, Argentina</Etiqueta>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-4/5 overflow-hidden rounded-pieza bg-superficie-2">
              {foto ? (
                <img
                  src={foto}
                  alt={destacado.name}
                  className="h-full w-full object-cover"
                  // La imagen del hero es lo primero que se ve: no se difiere.
                  loading="eager"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="h-full w-full opacity-70"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(180deg, var(--color-borde) 0px, var(--color-borde) 3px, transparent 3px, transparent 12px)",
                  }}
                />
              )}
            </div>

            {destacado && (
              <Link
                to={`/producto/${destacado.slug}`}
                className="mt-4 flex items-baseline justify-between gap-3 border-b border-borde pb-3 transition hover:border-marca"
              >
                <span className="text-tinta">{destacado.name}</span>
                <span className="shrink-0 text-sm text-tenue">
                  {formatPrice(destacado.price)}
                </span>
              </Link>
            )}
          </div>
        </div>
      </Contenedor>
    </section>
  );
}

/** Bloque de marca, al final de la Home: cuenta quién hace los muebles. */
function Historia() {
  return (
    <section className="border-t border-borde bg-superficie-2/60 py-seccion-lg sm:py-seccion-lg">
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
    <section className="py-seccion sm:py-seccion-lg">
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
