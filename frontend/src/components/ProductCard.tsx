import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatPrice } from "../lib/format";
import { Etiqueta } from "./ui";

export default function ProductCard({ product }: { product: Product }) {
  const sinStock = product.stock === 0;

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="group flex flex-col rounded-pieza border border-borde bg-superficie transition hover:border-marca"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-superficie-2">
        {product.images[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
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
