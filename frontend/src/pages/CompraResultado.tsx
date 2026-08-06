import { useEffect, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrder } from "../hooks/useOrder";
import { formatPrice } from "../lib/format";
import type { Order } from "../types";

// Las tres rutas a las que Mercado Pago devuelve al comprador. Tienen que
// coincidir exactamente con las back_urls de mercadopago.service.ts.
const RESULTADOS = ["exitosa", "fallida", "pendiente"] as const;
type Resultado = (typeof RESULTADOS)[number];

function esResultado(valor: string | undefined): valor is Resultado {
  return RESULTADOS.includes(valor as Resultado);
}

export default function CompraResultado() {
  const { resultado } = useParams<{ resultado: string }>();
  const [searchParams] = useSearchParams();
  const { clear } = useCart();

  // Mercado Pago agrega payment_id, status, collection_status y varios más a
  // esta URL. Los ignoramos TODOS: son falsificables, cualquiera puede escribir
  // ?status=approved a mano. external_reference se usa nada más que para buscar
  // el pedido; el estado que se muestra sale siempre de nuestra base.
  const orderId = searchParams.get("external_reference");

  const { order, loading, error, esperandoConfirmacion } = useOrder(orderId);

  // El carrito se vacía únicamente cuando NUESTRA base dice que está pagado,
  // no cuando Mercado Pago nos manda de vuelta.
  const yaVaciado = useRef(false);

  useEffect(() => {
    if (order?.status === "pagado" && !yaVaciado.current) {
      yaVaciado.current = true;
      clear();
    }
  }, [order?.status, clear]);

  if (!esResultado(resultado)) {
    return (
      <Marco titulo="Página no encontrada">
        <p className="text-neutral-700">Ese enlace no corresponde a ninguna compra.</p>
      </Marco>
    );
  }

  if (resultado === "fallida") {
    return (
      <Marco titulo="El pago no se completó">
        <p className="text-neutral-700">
          No se pudo procesar el pago. No se te cobró nada y tu carrito sigue
          intacto, así que podés intentar de nuevo cuando quieras.
        </p>
        <DetallePedido order={order} loading={loading} error={error} />
        <div className="mt-6 flex gap-4">
          <Link to="/carrito" className="underline">
            Volver al carrito
          </Link>
          <Link to="/" className="underline">
            Ver el catálogo
          </Link>
        </div>
      </Marco>
    );
  }

  if (resultado === "pendiente") {
    return (
      <Marco titulo="Tu pago está pendiente">
        <p className="text-neutral-700">
          Generamos tu cupón de pago. Cuando lo abones en el local de cobranza, tu
          pedido se confirma automáticamente y te avisamos por email.
        </p>
        <p className="mt-3 text-sm text-neutral-600">
          Los pagos en efectivo pueden tardar hasta dos días hábiles en acreditarse.
        </p>
        <DetallePedido order={order} loading={loading} error={error} />
        <Link to="/" className="mt-6 inline-block underline">
          Volver al catálogo
        </Link>
      </Marco>
    );
  }

  // resultado === "exitosa"
  const confirmado = order?.status === "pagado";

  return (
    <Marco titulo={confirmado ? "¡Gracias por tu compra!" : "Recibimos tu pago"}>
      {confirmado ? (
        <p className="text-neutral-700">
          Tu pago está confirmado. Te mandamos el detalle por email y nos
          contactamos para coordinar la entrega.
        </p>
      ) : (
        <p className="text-neutral-700">
          {esperandoConfirmacion
            ? "Estamos confirmando el pago con Mercado Pago. Esto puede tardar unos segundos."
            : "Tu pedido quedó registrado. Apenas Mercado Pago confirme el pago te avisamos por email."}
        </p>
      )}

      <DetallePedido order={order} loading={loading} error={error} />

      <Link to="/" className="mt-6 inline-block underline">
        Seguir comprando
      </Link>
    </Marco>
  );
}

function DetallePedido({
  order,
  loading,
  error,
}: {
  order: Order | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <p className="mt-6 text-sm text-neutral-500">Buscando tu pedido...</p>;
  }

  // Sin external_reference (alguien entró a mano) no hay nada que mostrar, pero
  // el mensaje principal de la página sigue teniendo sentido.
  if (!order) {
    if (error) {
      return (
        <p className="mt-6 text-sm text-neutral-600">
          No pudimos recuperar el detalle del pedido: {error}
        </p>
      );
    }
    return null;
  }

  return (
    <section className="mt-8 border-y border-neutral-300 py-4">
      <div className="flex flex-wrap justify-between gap-2">
        <span className="text-sm text-neutral-500">
          Pedido <span className="text-neutral-900">{order.id}</span>
        </span>
        <EstadoPedido status={order.status} />
      </div>

      <ul className="mt-4 space-y-1">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between text-sm">
            <span className="text-neutral-700">
              {item.product.name} × {item.quantity}
            </span>
            <span className="text-neutral-900">
              {formatPrice(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-between border-t border-neutral-300 pt-3">
        <span className="text-neutral-700">Total</span>
        <span className="text-lg text-neutral-900">{formatPrice(order.total)}</span>
      </div>
    </section>
  );
}

function EstadoPedido({ status }: { status: Order["status"] }) {
  const etiqueta = {
    pendiente: "Pendiente de pago",
    pagado: "Pagado",
    enviado: "Enviado",
  }[status];

  return (
    <span className="border border-neutral-400 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-700">
      {etiqueta}
    </span>
  );
}

function Marco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl text-neutral-900">{titulo}</h1>
      <div className="mt-4">{children}</div>
    </main>
  );
}
