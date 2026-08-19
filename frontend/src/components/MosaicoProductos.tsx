import { Link } from "react-router-dom";
import type { Product } from "../types";
import FotoProducto from "./FotoProducto";
import { formatPrice } from "../lib/format";
import { Etiqueta } from "./ui";

/**
 * Grilla de productos, todas las fichas con el mismo recuadro.
 *
 * Se probó mezclar proporciones —alta, ancha, cuadrada— para que la grilla no
 * quedara monótona, y el resultado fue lo contrario de lo buscado: el catálogo
 * se veía desordenado y ninguna pieza se leía mejor que otra.
 *
 * Uniforme tiene además una ventaja concreta: las fotos de los muebles son
 * verticales, así que un recuadro vertical es el que menos recorta. El catálogo
 * es para comparar piezas entre sí, y para comparar hacen falta las mismas
 * condiciones.
 */
const PROPORCION = "aspect-3/4";

export default function MosaicoProductos({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <Tarjeta key={p.id} product={p} />
      ))}
    </div>
  );
}

function Tarjeta({ product }: { product: Product }) {
  const sinStock = product.stock === 0;

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="group flex flex-col rounded-pieza border border-borde bg-superficie transition hover:border-marca"
    >
      <div className={`relative overflow-hidden bg-superficie-2 ${PROPORCION}`}>
        <FotoProducto src={product.images[0]} alt={product.name} uso="tarjeta" />

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
