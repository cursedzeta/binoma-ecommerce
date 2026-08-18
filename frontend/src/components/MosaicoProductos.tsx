import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatPrice } from "../lib/format";
import { Etiqueta } from "./ui";

/**
 * Grilla de productos con proporciones mezcladas.
 *
 * Una grilla de recuadros todos iguales le queda mal a los muebles: una mesa
 * baja y un banco alto no piden el mismo encuadre, y la foto termina recortada
 * o con aire de sobra.
 *
 * El patrón se repite cada cuatro piezas: alta, ancha, cuadrada, cuadrada. Es
 * fijo a propósito, no aleatorio: aleatorio cambiaría en cada carga y el
 * catálogo se sentiría inestable.
 */
const PROPORCIONES = ["aspect-3/4", "aspect-4/3", "aspect-square", "aspect-square"];

export default function MosaicoProductos({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p, i) => (
        <Tarjeta key={p.id} product={p} proporcion={PROPORCIONES[i % PROPORCIONES.length]!} />
      ))}
    </div>
  );
}

function Tarjeta({ product, proporcion }: { product: Product; proporcion: string }) {
  const sinStock = product.stock === 0;

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="group flex flex-col rounded-pieza border border-borde bg-superficie transition hover:border-marca"
    >
      <div className={`relative overflow-hidden bg-superficie-2 ${proporcion}`}>
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          // Sin foto, la textura de láminas evita el rectángulo gris vacío.
          <div
            aria-hidden="true"
            className="h-full w-full opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(180deg, var(--color-borde) 0px, var(--color-borde) 2px, transparent 2px, transparent 9px)",
            }}
          />
        )}

        {sinStock && (
          <span className="absolute left-3 top-3 rounded-pieza bg-fondo/95 px-2 py-1 text-xs text-tenue">
            Sin stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <Etiqueta>{product.category}</Etiqueta>
        <h3 className="text-subtitulo leading-snug text-tinta">{product.name}</h3>
        <p className="mt-auto pt-2 text-tinta">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
