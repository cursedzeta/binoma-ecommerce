import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatPrice } from "../lib/format";

export default function ProductCard({ product }: { product: Product }) {
  const sinStock = product.stock === 0;

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="group block border border-neutral-300 hover:border-neutral-900"
    >
      <div className="aspect-4/3 overflow-hidden bg-neutral-100">
        {product.images[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          {product.category}
        </p>
        <h2 className="text-base text-neutral-900">{product.name}</h2>
        <p className="text-sm text-neutral-700">{formatPrice(product.priceDirect)}</p>
        {sinStock && (
          <p className="text-xs uppercase tracking-wide text-neutral-500">Sin stock</p>
        )}
      </div>
    </Link>
  );
}
