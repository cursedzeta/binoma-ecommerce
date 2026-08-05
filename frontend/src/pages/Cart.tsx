import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useProducts } from "../hooks/useProducts";
import { formatPrice } from "../lib/format";

export default function Cart() {
  const { items, removeItem, setQuantity, clear } = useCart();
  const { data: products, loading, error } = useProducts();

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl text-neutral-900">Tu carrito</h1>
        <p className="mt-4 text-neutral-600">Todavía no agregaste productos.</p>
        <Link to="/" className="mt-4 inline-block underline">
          Ver el catálogo
        </Link>
      </main>
    );
  }

  if (loading) {
    return <Estado>Cargando tu carrito...</Estado>;
  }

  if (error || !products) {
    return <Estado>No se pudo cargar el carrito: {error}</Estado>;
  }

  // El carrito guarda ids; los datos para mostrar salen del catálogo actual.
  // Si un producto ya no existe (lo borraron), queda fuera de la lista.
  const lineas = items.flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return [];
    return [{ item, product, subtotal: product.price * item.quantity }];
  });

  const desaparecidos = items.length - lineas.length;
  const total = lineas.reduce((acc, l) => acc + l.subtotal, 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl text-neutral-900">Tu carrito</h1>

      {desaparecidos > 0 && (
        <p className="mt-4 border border-neutral-400 p-3 text-sm text-neutral-700">
          {desaparecidos === 1
            ? "Un producto ya no está disponible y se quitó del carrito."
            : `${desaparecidos} productos ya no están disponibles y se quitaron del carrito.`}
        </p>
      )}

      <ul className="mt-8 divide-y divide-neutral-300 border-y border-neutral-300">
        {lineas.map(({ item, product, subtotal }) => (
          <li key={product.id} className="flex gap-4 py-6">
            <Link
              to={`/producto/${product.slug}`}
              className="h-24 w-32 shrink-0 overflow-hidden bg-neutral-100"
            >
              {product.images[0] && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              )}
            </Link>

            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Link
                  to={`/producto/${product.slug}`}
                  className="text-neutral-900 hover:underline"
                >
                  {product.name}
                </Link>
                <p className="text-sm text-neutral-600">
                  {formatPrice(product.price)} c/u
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setQuantity(product.id, item.quantity - 1, product.stock)
                  }
                  aria-label={`Quitar una unidad de ${product.name}`}
                  className="border border-neutral-300 px-2 leading-6 hover:border-neutral-900"
                >
                  −
                </button>

                <span className="w-8 text-center text-sm">{item.quantity}</span>

                <button
                  onClick={() =>
                    setQuantity(product.id, item.quantity + 1, product.stock)
                  }
                  disabled={item.quantity >= product.stock}
                  aria-label={`Agregar una unidad de ${product.name}`}
                  className="border border-neutral-300 px-2 leading-6 hover:border-neutral-900 disabled:text-neutral-300 disabled:hover:border-neutral-300"
                >
                  +
                </button>

                {item.quantity >= product.stock && (
                  <span className="text-xs text-neutral-500">
                    máximo disponible
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end justify-between">
              <p className="text-neutral-900">{formatPrice(subtotal)}</p>
              <button
                onClick={() => removeItem(product.id)}
                className="text-sm text-neutral-600 underline hover:text-neutral-900"
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-start justify-between">
        <button
          onClick={clear}
          className="text-sm text-neutral-600 underline hover:text-neutral-900"
        >
          Vaciar carrito
        </button>

        <div className="text-right">
          <p className="text-sm text-neutral-600">Total</p>
          <p className="text-2xl text-neutral-900">{formatPrice(total)}</p>
          {/* Checkout: sprint 4 */}
          <button
            disabled
            className="mt-4 border border-neutral-300 px-6 py-3 text-neutral-400"
          >
            Finalizar compra
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
