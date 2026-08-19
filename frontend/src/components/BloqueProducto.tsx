import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatPrice } from "../lib/format";
import FotoProducto from "./FotoProducto";
import { FlechaCta } from "./ui";

/**
 * Un producto destacado: su nombre y dos fotos en mosaico.
 *
 * Con un catálogo chico conviene darle a cada pieza su propio bloque en vez de
 * amontonarlas en una grilla. La foto grande muestra el mueble entero; la
 * angosta, el detalle —el canto, el ensamble— que es lo que distingue al
 * fenólico y lo que justifica el precio.
 */
export default function BloqueProducto({ product }: { product: Product }) {
  const [principal, secundaria] = product.images;
  const sinStock = product.stock === 0;

  return (
    <article className="border-t border-borde pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="text-titulo text-tinta">
          <Link to={`/producto/${product.slug}`} className="transition hover:text-marca-texto">
            {product.name}
          </Link>
        </h3>
        <p className="text-subtitulo text-tenue">
          {formatPrice(product.price)}
          {sinStock && <span className="ml-3 text-sm">Sin stock</span>}
        </p>
      </div>

      {/* Cinco columnas: tres para la foto grande, dos para el detalle.

          Los marcos son altos a propósito. Las fotos de los muebles son
          verticales, y en un recuadro apaisado se les recortaba casi la mitad
          del alto. Acá el recorte es inevitable —una grilla necesita recuadros
          parejos, con fotos que no lo son— así que se elige la proporción que
          menos lastima: cuadrada en escritorio, vertical en mobile. La ficha
          del producto es la que muestra la pieza entera.

          La altura de la fila la fija la proporción de la izquierda, y la
          derecha se estira hasta igualarla. Para que eso funcione, las dos
          imágenes van con `absolute inset-0`: si quedaran en el flujo, la de
          la derecha —que no tiene proporción propia— se dibujaría con su alto
          real y sobresaldría por abajo. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-5">
        <Link
          to={`/producto/${product.slug}`}
          className="group relative overflow-hidden rounded-pieza bg-superficie-2 aspect-4/5 sm:col-span-3 sm:aspect-square"
        >
          <FotoProducto
            src={principal}
            alt={product.name}
            uso="bloque"
            // Las fotos de estudio vienen con aire arriba. Recortando por el
            // centro ese aire se queda y se van las patas del mueble, que es
            // justo lo que hay que ver. Corriendo el foco hacia abajo se tira
            // el fondo vacío y entra la pieza entera.
            foco="object-[50%_80%]"
            className="absolute inset-0"
          />

          {/* El "Ver más" va sobre la foto, abajo a la derecha. Lleva fondo
              propio porque encima de una imagen clara el texto se pierde. */}
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-pieza bg-fondo/90 px-3 py-1.5 text-sm text-tinta backdrop-blur transition group-hover:text-marca-texto">
            Ver más
            <FlechaCta />
          </span>
        </Link>

        <Link
          to={`/producto/${product.slug}`}
          className="group relative overflow-hidden rounded-pieza bg-superficie-2 aspect-4/5 sm:col-span-2 sm:aspect-auto"
          aria-hidden="true"
          tabIndex={-1}
        >
          <FotoProducto
            src={secundaria ?? principal}
            alt=""
            uso="bloque"
            className="absolute inset-0"
          />
        </Link>
      </div>
    </article>
  );
}

