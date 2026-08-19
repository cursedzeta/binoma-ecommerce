import BloqueProducto from "../components/BloqueProducto";
import FotoProducto from "../components/FotoProducto";
import { imagenOptimizada, srcSetOptimizado } from "../lib/imagen";
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
  // Un bloque por pieza: con un catálogo chico entran todas, y las que se
  // pueden comprar van primero.
  const destacados = (products ?? [])
    .slice()
    .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));

  return (
    <>
      <Hero destacado={destacados[0]} />

      {/* Este bloque es el que tapa al hero al scrollear, y por eso necesita
          fondo propio y estar por delante.

          `data-fin-hero` es la marca que busca la barra de navegación para
          saber si todavía está apoyada sobre el naranja. Vive acá y no en la
          barra porque el hero es de esta página: en el catálogo o el carrito no
          hay marca, y la barra se pinta normal sin que nadie le avise. */}
      <div data-fin-hero className="relative z-10 bg-fondo">
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

        {/* El primer bloque no lleva su línea: ya la puso el encabezado de la
            sección, y dos seguidas se ven como un error. */}
        {destacados.length > 0 && (
          <div className="flex flex-col gap-seccion [&>*:first-child]:border-t-0 [&>*:first-child]:pt-0">
            {destacados.map((p) => (
              <BloqueProducto key={p.id} product={p} />
            ))}
          </div>
        )}
        </Seccion>

        <Historia />
      </div>
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
/**
 * Zoom interno de la foto del hero. Acerca la imagen dentro del marco, sin
 * tocar el marco: el recuadro mide lo mismo y lo que sobra se recorta.
 *
 *   scale-100  sin zoom        scale-110  +10%        scale-125  +25%
 *
 * Para un valor intermedio va entre corchetes: `scale-[1.15]`.
 *
 * Cuanto más alto, más se recorta. Si al acercar se van las patas del mueble,
 * el acompañante de esto es `foco` en `FotoProducto`: el zoom decide cuánto se
 * recorta y el foco decide de qué lado.
 */
const ZOOM_HERO = "scale-100";

function Hero({ destacado }: { destacado?: Product }) {
  // La segunda foto es la que aparece al pasar el mouse. Si la pieza tiene una
  // sola, no hay cambio y el hero se comporta como antes.
  const [foto, fotoAlPasar] = destacado?.images ?? [];

  return (
    // Esconderse detrás de la tienda es `sticky top-0`: el hero se queda
    // clavado donde está y el resto de la página le pasa por encima, en vez de
    // arrastrarse hacia arriba con el scroll. Para que se vea así, lo que sigue
    // lleva fondo propio y va por delante; si no, el naranja se transparenta.
    //
    // Solo de lg para arriba, y de la mano de `min-h-dvh`: quedarse clavado
    // arriba solo funciona si el hero entra en una pantalla. En mobile el
    // contenido apilado es más alto que eso, así que ahí se comporta como una
    // sección normal y se va con el scroll.
    // El margen negativo de arriba es lo que hace que el naranja arranque en
    // el borde de la página y no debajo de la barra. La barra está en el flujo
    // normal, así que sin esto el hero empieza después de ella y quedaba una
    // franja clara arriba, con la barra en blanco encima: ilegible.
    //
    // El `pt` del mismo tamaño devuelve el aire: el fondo sube, el contenido
    // no. Los dos valores acompañan al alto de la barra (h-16 / sm:h-18).
    <section className="-mt-16 bg-marca pt-16 sm:-mt-18 sm:pt-18 lg:sticky lg:top-0 lg:z-0 lg:flex lg:min-h-dvh lg:items-center">
      <Contenedor className="relative w-full">
        <div className="grid items-center gap-12 py-seccion lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="text-display text-sobre-hero">
              Diseño y fenólico, en su forma más <strong>honesta</strong>
            </h1>

            <p className="mt-6 max-w-md text-subtitulo text-sobre-hero/85">
              Muebles pensados para durar, hechos en Córdoba con la precisión de
              un material que no perdona errores.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              {/* Blanco, no el primario: el primario es naranja y sobre naranja
                  no existiría. */}
              <BotonLink to="/catalogo" variante="claro" flecha>
                Ver el catálogo
              </BotonLink>
              <Etiqueta tono="claro">Córdoba, Argentina</Etiqueta>
            </div>
          </div>

          {/* La foto ocupa toda la columna, sin tope de tamaño.

              Dos cosas que no hay que volver a poner acá:

              - `mx-auto`: en un elemento de grilla, los márgenes automáticos le
                sacan el estirado y lo dejan del ancho de su contenido. Como el
                recuadro de la foto no tiene ancho propio, el bloque terminaba
                midiendo lo que mide el texto del precio.
              - un tope de alto sobre el recuadro de la foto: al recortarle el
                alto, el navegador le achica también el ancho para no
                deformarla, y la línea del precio —que es hermana, no hija— se
                quedaba con el ancho de la columna. Si alguna vez hace falta
                limitar el tamaño, va como `max-w` acá, en el padre, para que
                las dos hereden la misma medida. */}
          {/* En rem y no en px: los px se quedan fijos cuando cambia la
              escala del sitio (el font-size de la raíz, en index.css), y la
              foto se agrandaría respecto de todo lo demás. 25rem son los
              400px de antes. */}
          <div className="relative lg:max-w-[25rem]">
            <div className="group relative aspect-4/5 w-full overflow-hidden rounded-pieza bg-superficie-2">
              <FotoProducto
                src={foto}
                alt={destacado?.name ?? ""}
                uso="ficha"
                prioridad
                className={`absolute inset-0 ${ZOOM_HERO}`}
              />

              {fotoAlPasar && (
                <FotoProducto
                  src={fotoAlPasar}
                  // Vacío a propósito: es la misma pieza que ya nombró la foto
                  // de abajo. Repetirlo se lo leería dos veces a quien usa
                  // lector de pantalla.
                  alt=""
                  uso="ficha"
                  prioridad
                  className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none ${ZOOM_HERO}`}
                />
              )}
            </div>

            {destacado && (
              <Link
                to={`/producto/${destacado.slug}`}
                className="mt-4 flex items-baseline justify-between gap-3 border-b border-sobre-hero/30 pb-3 transition hover:border-sobre-hero"
              >
                <span className="text-sobre-hero">{destacado.name}</span>
                <span className="shrink-0 text-sm text-sobre-hero/75">
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

/**
 * La foto de fondo del bloque del taller.
 *
 * Va escrita acá, en el componente, y no en una variable de entorno: es parte
 * del diseño de esta sección, no una configuración del servidor. Si algún día
 * hay que cambiarla se cambia esta línea, que es donde alguien la va a buscar.
 */
const FONDO_TALLER =
  "https://res.cloudinary.com/zye3zjm3/image/upload/v1787101259/imagen_fondo_banner.jpg";

/**
 * Qué parte de la foto se ve.
 *
 * El banner es ancho y bajo, la foto no: entra por el ancho y se le recorta
 * arriba y abajo. Esto elige de dónde se recorta.
 *
 *   object-top            se queda con el techo de la foto
 *   object-center         por el medio (el que está)
 *   object-bottom         se queda con el piso
 *   object-[50%_35%]      cualquier punto intermedio: el 2do número es la
 *                         altura, 0% arriba y 100% abajo
 */
const ENCUADRE_TALLER = "object-center";

/**
 * Zoom interno de la foto, sin tocar el alto del banner.
 *
 *   scale-100  sin zoom (el que está)     scale-110  +10%     scale-125  +25%
 *   scale-[1.15] para un valor intermedio
 *
 * Sirve para acercarse a un detalle. Cuanto más alto, más recorte.
 */
const ZOOM_TALLER = "scale-100";

/**
 * Cuánto se oscurece la foto para que el texto blanco se lea.
 *
 *   bg-velo/50  la foto se ve más, el texto se lee peor
 *   bg-velo/70  el que está
 *   bg-velo/85  la foto queda casi de textura
 *
 * Por debajo de /50 el blanco empieza a perderse en las zonas claras de la
 * imagen, y eso cambia según el ancho de la pantalla: lo que se lee en el
 * monitor puede no leerse en el teléfono.
 */
const VELO_TALLER = "bg-velo/70";

/**
 * El alto del banner.
 *
 *   py-seccion-lg   el que está (6rem arriba y abajo)
 *   py-seccion      más bajo (4rem)
 *   min-h-[70dvh] flex items-center   para que ocupe casi toda la pantalla
 */
const ALTO_TALLER = "py-seccion-lg";

/** Bloque de marca, al final de la Home: cuenta quién hace los muebles. */
function Historia() {
  return (
    // `isolate` encierra el apilado acá adentro: los -z de la foto y del velo
    // quedan detrás del texto de esta sección, pero no se van detrás del fondo
    // de la página ni se mezclan con el hero.
    <section className={`relative isolate overflow-hidden ${ALTO_TALLER}`}>
      <img
        src={imagenOptimizada(FONDO_TALLER, 1600)}
        srcSet={srcSetOptimizado(FONDO_TALLER, [960, 1600, 2400])}
        sizes="100vw"
        // Decorativa: lo que dice esta sección ya está en el texto. Un alt que
        // describiera el taller le sumaría ruido a quien usa lector de pantalla
        // sin agregarle nada.
        alt=""
        aria-hidden="true"
        loading="lazy"
        className={`absolute inset-0 -z-20 h-full w-full object-cover ${ENCUADRE_TALLER} ${ZOOM_TALLER}`}
      />

      {/* Velo negro al 70%. Sin él, el blanco sobre una foto clara sería
          ilegible en las zonas iluminadas: el contraste dependería de qué parte
          de la imagen quedó detrás de cada línea, que es justo lo que no se
          puede controlar cuando la foto se recorta según el ancho. */}
      <div aria-hidden="true" className={`absolute inset-0 -z-10 ${VELO_TALLER}`} />

      <Contenedor ancho="angosto" className="text-center">
        <Etiqueta tono="claro">El taller</Etiqueta>
        <h2 className="mt-3 text-titulo text-sobre-hero">
          Muebles que se piensan antes de cortarse
        </h2>
        <p className="mx-auto mt-6 max-w-xl leading-relaxed text-sobre-hero/85">
          Trabajamos el fenólico por lo que es: una madera honesta, que muestra sus
          capas en el canto y no necesita esconderse detrás de un revestimiento. Cada
          pieza se arma sin herrajes a la vista, para que lo que se vea sea la madera y
          la línea.
        </p>
        <div className="mt-8 flex justify-center">
          <EnlaceFlecha to="/catalogo" tono="claro">
            Ver las piezas
          </EnlaceFlecha>
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
