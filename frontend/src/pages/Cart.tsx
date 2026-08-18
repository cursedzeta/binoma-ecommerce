import { useState } from "react";
import { Link } from "react-router-dom";
import FormularioCompra from "../components/FormularioCompra";
import { Boton, BotonLink, Contenedor, Etiqueta } from "../components/ui";
import { useCart } from "../context/CartContext";
import { useProducts } from "../hooks/useProducts";
import { formatPrice } from "../lib/format";

export default function Cart() {
  const { items, removeItem, setQuantity, clear } = useCart();
  const { data: products, loading, error } = useProducts();

  // El checkout no es otra página: es un segundo momento de esta misma. Cada
  // paso extra entre "quiero esto" y "pagué" pierde compradores.
  const [completandoDatos, setCompletandoDatos] = useState(false);
  const [pedidoSinPago, setPedidoSinPago] = useState<string | null>(null);

  if (pedidoSinPago) {
    return (
      <Contenedor ancho="angosto" className="py-20">
        <h1 className="text-titulo text-tinta">Pedido registrado</h1>
        <p className="mt-4 text-tenue">
          Guardamos tu pedido, pero el cobro online no está disponible en este
          momento. Nos vamos a contactar para coordinar el pago.
        </p>
        <p className="mt-6 text-sm text-tenue">
          Número de pedido: <span className="text-tinta">{pedidoSinPago}</span>
        </p>
        <BotonLink to="/catalogo" flecha className="mt-8">
          Volver al catálogo
        </BotonLink>
      </Contenedor>
    );
  }

  if (items.length === 0) {
    return (
      <Contenedor ancho="angosto" className="py-20">
        <h1 className="text-titulo text-tinta">Tu carrito</h1>
        <p className="mt-4 text-tenue">Todavía no agregaste piezas.</p>
        <BotonLink to="/catalogo" flecha className="mt-8">
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
  const unidades = lineas.reduce((acc, l) => acc + l.item.quantity, 0);

  // Con el formulario abierto la lista pasa a ser un resumen compacto: lo que
  // importa es completar los datos, pero el pedido tiene que seguir visible
  // para que nadie pague a ciegas.
  return (
    <Contenedor className="py-10 pb-28 sm:py-16 sm:pb-16">
      <div className="flex items-baseline gap-3">
        <h1 className="text-titulo text-tinta">
          {completandoDatos ? "Tus datos" : "Tu carrito"}
        </h1>
        <span className="text-sm text-tenue">
          {unidades} {unidades === 1 ? "pieza" : "piezas"}
        </span>
      </div>

      {completandoDatos && (
        <button
          onClick={() => setCompletandoDatos(false)}
          className="mt-2 text-sm text-tenue underline transition hover:text-tinta"
        >
          ← Volver a editar el carrito
        </button>
      )}

      {desaparecidos > 0 && (
        <p className="mt-5 rounded-pieza border-l-2 border-alerta bg-alerta-suave px-4 py-3 text-sm">
          {desaparecidos === 1
            ? "Una pieza ya no está disponible y se quitó del carrito."
            : `${desaparecidos} piezas ya no están disponibles y se quitaron del carrito.`}
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-12">
        <div>
          {completandoDatos ? (
            <FormularioCompra onPedidoSinPago={setPedidoSinPago} />
          ) : (
            <ul className="flex flex-col divide-y divide-borde border-y border-borde">
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
                      <p className="text-sm text-tenue">
                        {formatPrice(product.price)} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Cantidad
                        label={`Quitar una unidad de ${product.name}`}
                        onClick={() =>
                          setQuantity(product.id, item.quantity - 1, product.stock)
                        }
                      >
                        –
                      </Cantidad>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <Cantidad
                        label={`Agregar una unidad de ${product.name}`}
                        onClick={() =>
                          setQuantity(product.id, item.quantity + 1, product.stock)
                        }
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
                    <p className="font-medium tabular-nums text-tinta">
                      {formatPrice(subtotal)}
                    </p>
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
          )}
        </div>

        {/* Resumen del pedido, al costado en escritorio. Sticky para que el
            total quede a la vista mientras se recorre la lista o se completan
            los datos. */}
        <aside className="rounded-pieza border border-borde bg-superficie p-5 lg:sticky lg:top-24">
          <h2 className="text-subtitulo text-tinta">Resumen del pedido</h2>

          {completandoDatos && (
            <ul className="mt-4 flex flex-col gap-1.5 border-b border-borde pb-4">
              {lineas.map(({ item, product, subtotal }) => (
                <li key={product.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-tenue">
                    {product.name} × {item.quantity}
                  </span>
                  <span className="shrink-0 tabular-nums text-tinta">
                    {formatPrice(subtotal)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-5 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-tenue">Subtotal</dt>
              <dd className="tabular-nums text-tinta">{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-tenue">Envío</dt>
              <dd className="text-tenue">A coordinar</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-baseline justify-between border-t border-borde pt-4">
            <span className="text-tinta">Total</span>
            <span className="text-2xl font-semibold tabular-nums text-tinta">
              {formatPrice(total)}
            </span>
          </div>

          {!completandoDatos && (
            <Boton
              onClick={() => setCompletandoDatos(true)}
              flecha
              className="mt-5 hidden w-full sm:inline-flex"
            >
              Finalizar compra
            </Boton>
          )}

          <p className="mt-4 text-xs text-tenue">
            El envío se coordina por Instagram o teléfono después de la compra.
          </p>

          {!completandoDatos && (
            <button
              onClick={clear}
              className="mt-5 text-sm text-tenue underline transition hover:text-tinta"
            >
              Vaciar carrito
            </button>
          )}
        </aside>
      </div>

      {/* En mobile el botón vive fijo abajo. Con el formulario abierto
          desaparece: el de pagar ya está dentro del formulario, y dos botones
          de acción a la vez confunden. */}
      {!completandoDatos && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-fondo/95 backdrop-blur sm:hidden">
          <div className="flex items-center gap-3 px-5 py-3">
            <div>
              <p className="text-xs text-tenue">Total</p>
              <p className="text-lg font-semibold text-tinta">{formatPrice(total)}</p>
            </div>
            <Boton
              onClick={() => setCompletandoDatos(true)}
              className="ml-auto shrink-0"
            >
              Finalizar compra
            </Boton>
          </div>
        </div>
      )}
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
