import { Link } from "react-router-dom";
import { BotonLink, Contenedor, Etiqueta } from "../components/ui";
import { useCart } from "../context/CartContext";
import { useProducts } from "../hooks/useProducts";
import { formatPrice } from "../lib/format";

export default function Cart() {
  const { items, removeItem, setQuantity, clear } = useCart();
  const { data: products, loading, error } = useProducts();

  if (items.length === 0) {
    return (
      <Contenedor ancho="angosto" className="py-20">
        <h1 className="text-titulo text-tinta">Tu carrito</h1>
        <p className="mt-4 text-tenue">Todavía no agregaste piezas.</p>
        <BotonLink to="/" className="mt-8">
          Ver el catálogo
        </BotonLink>
      </Contenedor>
    );
  }

  if (loading || !products) {
    return (
      <Contenedor ancho="angosto" className="py-20 text-tenue">
        {error ? `No se pudo cargar el carrito: ${error}` : "Cargando tu carrito..."}
      </Contenedor>
    );
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
    <Contenedor ancho="angosto" className="py-10 sm:py-16">
      <h1 className="text-titulo text-tinta">Tu carrito</h1>

      {desaparecidos > 0 && (
        <p className="mt-5 rounded-pieza border-l-2 border-alerta bg-alerta-suave px-4 py-3 text-sm">
          {desaparecidos === 1
            ? "Una pieza ya no está disponible y se quitó del carrito."
            : `${desaparecidos} piezas ya no están disponibles y se quitaron del carrito.`}
        </p>
      )}

      <ul className="mt-8 flex flex-col divide-y divide-borde border-y border-borde">
        {lineas.map(({ item, product, subtotal }) => (
          <li key={product.id} className="flex flex-wrap gap-4 py-5 sm:flex-nowrap">
            <Link
              to={`/producto/${product.slug}`}
              className="h-24 w-32 shrink-0 overflow-hidden rounded-pieza bg-superficie-2"
            >
              {product.images[0] && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </Link>

            <div className="flex min-w-40 flex-1 flex-col justify-between gap-3">
              <div>
                <Etiqueta>{product.category}</Etiqueta>
                <Link
                  to={`/producto/${product.slug}`}
                  className="block text-tinta transition hover:text-marca-texto"
                >
                  {product.name}
                </Link>
                <p className="text-sm text-tenue">{formatPrice(product.price)} c/u</p>
              </div>

              <div className="flex items-center gap-2">
                <Cantidad
                  label={`Quitar una unidad de ${product.name}`}
                  onClick={() => setQuantity(product.id, item.quantity - 1, product.stock)}
                >
                  −
                </Cantidad>
                <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                <Cantidad
                  label={`Agregar una unidad de ${product.name}`}
                  onClick={() => setQuantity(product.id, item.quantity + 1, product.stock)}
                  disabled={item.quantity >= product.stock}
                >
                  +
                </Cantidad>
                {item.quantity >= product.stock && (
                  <span className="text-xs text-tenue">máximo disponible</span>
                )}
              </div>
            </div>

            <div className="flex w-full flex-row items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end sm:justify-between">
              <p className="text-tinta">{formatPrice(subtotal)}</p>
              <button
                onClick={() => removeItem(product.id)}
                className="text-sm text-tenue underline transition hover:text-tinta"
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
        <button
          onClick={clear}
          className="text-sm text-tenue underline transition hover:text-tinta"
        >
          Vaciar carrito
        </button>

        <div className="ml-auto text-right">
          <Etiqueta>Total</Etiqueta>
          <p className="font-display text-3xl text-tinta">{formatPrice(total)}</p>
          <BotonLink to="/checkout" className="mt-4">
            Finalizar compra
          </BotonLink>
        </div>
      </div>
    </Contenedor>
  );
}

function Cantidad({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-8 w-8 rounded-pieza border border-borde text-tinta transition hover:border-tinta disabled:text-tenue disabled:hover:border-borde"
    >
      {children}
    </button>
  );
}
