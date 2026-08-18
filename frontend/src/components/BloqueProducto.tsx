import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatPrice } from "../lib/format";
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

      {/* Cinco columnas: tres para la foto grande, dos para el detalle. La
          altura la fija la de la izquierda y la derecha se estira sola. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-5">
        <Link
          to={`/producto/${product.slug}`}
          className="group relative overflow-hidden rounded-pieza bg-superficie-2 aspect-4/3 sm:col-span-3"
        >
          <Foto src={principal} alt={product.name} />

          {/* El "Ver más" va sobre la foto, abajo a la derecha. Lleva fondo
              propio porque encima de una imagen clara el texto se pierde. */}
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-pieza bg-fondo/90 px-3 py-1.5 text-sm text-tinta backdrop-blur transition group-hover:text-marca-texto">
            Ver más
            <FlechaCta />
          </span>
        </Link>

        <Link
          to={`/producto/${product.slug}`}
          className="group overflow-hidden rounded-pieza bg-superficie-2 aspect-square sm:col-span-2 sm:aspect-auto"
          aria-hidden="true"
          tabIndex={-1}
        >
          <Foto src={secundaria ?? principal} alt="" />
        </Link>
      </div>
    </article>
  );
}

function Foto({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    // Sin fotografía, la textura de láminas del fenólico evita el rectángulo
    // gris vacío. Desaparece sola en cuanto se carga una imagen.
    return (
      <div
        aria-hidden="true"
        className="h-full w-full opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, var(--color-borde) 0px, var(--color-borde) 3px, transparent 3px, transparent 12px)",
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
    />
  );
}
