import { Link, useParams } from "react-router-dom";
import { useProduct } from "../hooks/useProducts";
import { formatPrice } from "../lib/format";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, loading, error } = useProduct(slug ?? "");

  if (loading) {
    return <Estado>Cargando producto...</Estado>;
  }

  if (error || !product) {
    return (
      <Estado>
        {error ?? "Producto no encontrado"}
        <Link to="/" className="mt-4 block underline">
          Volver al catálogo
        </Link>
      </Estado>
    );
  }

  const sinStock = product.stock === 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link to="/" className="text-sm text-neutral-600 underline">
        Volver al catálogo
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          {product.images.map((src, i) => (
            <div key={src} className="aspect-4/3 overflow-hidden bg-neutral-100">
              <img
                src={src}
                alt={`${product.name} — imagen ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {product.category}
          </p>
          <h1 className="mt-2 text-2xl text-neutral-900">{product.name}</h1>
          <p className="mt-4 text-xl text-neutral-900">
            {formatPrice(product.priceDirect)}
          </p>

          <p className="mt-6 leading-relaxed text-neutral-700">
            {product.description}
          </p>

          <p className="mt-6 text-sm text-neutral-600">
            {sinStock ? "Sin stock" : `${product.stock} disponibles`}
          </p>

          {/* Agregar al carrito: sprint 3 */}
          <button
            disabled={sinStock}
            className="mt-4 w-full border border-neutral-900 px-6 py-3 text-neutral-900 disabled:border-neutral-300 disabled:text-neutral-400"
          >
            {sinStock ? "Sin stock" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Estado({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 text-neutral-600">{children}</main>
  );
}
