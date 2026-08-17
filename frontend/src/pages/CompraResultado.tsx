import { useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { BotonLink, Contenedor, Etiqueta } from "../components/ui";
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
        <p className="text-tenue">Ese enlace no corresponde a ninguna compra.</p>
        <BotonLink to="/catalogo" className="mt-8">
          Ir al catálogo
        </BotonLink>
      </Marco>
    );
  }

  if (resultado === "fallida") {
    return (
      <Marco titulo="El pago no se completó">
        <p className="text-tenue">
          No se pudo procesar el pago. No se te cobró nada y tu carrito sigue
          intacto, así que podés intentar de nuevo cuando quieras.
        </p>
        <DetallePedido order={order} loading={loading} error={error} />
        <div className="mt-8 flex flex-wrap gap-3">
          <BotonLink to="/carrito">Volver al carrito</BotonLink>
          <BotonLink to="/catalogo" variante="secundario">
            Ver el catálogo
          </BotonLink>
        </div>
      </Marco>
    );
  }

  if (resultado === "pendiente") {
    return (
      <Marco titulo="Tu pago está pendiente">
        <p className="text-tenue">
          Generamos tu cupón de pago. Cuando lo abones en el local de cobranza, tu
          pedido se confirma automáticamente y te avisamos por email.
        </p>
        <p className="mt-3 text-sm text-tenue">
          Los pagos en efectivo pueden tardar hasta dos días hábiles en acreditarse.
        </p>
        <DetallePedido order={order} loading={loading} error={error} />
        <BotonLink to="/catalogo" className="mt-8">
          Volver al catálogo
        </BotonLink>
      </Marco>
    );
  }

  // resultado === "exitosa"
  const confirmado = order?.status === "pagado";

  return (
    <Marco titulo={confirmado ? "¡Gracias por tu compra!" : "Recibimos tu pago"}>
      {confirmado ? (
        <p className="text-tenue">
          Tu pago está confirmado. Te mandamos el detalle por email y nos
          contactamos para coordinar la entrega.
        </p>
      ) : (
        <p className="text-tenue">
          {esperandoConfirmacion
            ? "Estamos confirmando el pago con Mercado Pago. Esto puede tardar unos segundos."
            : "Tu pedido quedó registrado. Apenas Mercado Pago confirme el pago te avisamos por email."}
        </p>
      )}

      <DetallePedido order={order} loading={loading} error={error} />

      <BotonLink to="/catalogo" className="mt-8">
        Seguir comprando
      </BotonLink>
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
    return <p className="mt-8 text-sm text-tenue">Buscando tu pedido...</p>;
  }

  // Sin external_reference (alguien entró a mano) no hay nada que mostrar, pero
  // el mensaje principal de la página sigue teniendo sentido.
  if (!order) {
    if (error) {
      return (
        <p className="mt-8 text-sm text-tenue">
          No pudimos recuperar el detalle del pedido: {error}
        </p>
      );
    }
    return null;
  }

  return (
    <section className="mt-8 rounded-pieza border border-borde bg-superficie p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Etiqueta>Pedido</Etiqueta>
          <p className="text-sm text-tinta">{order.id}</p>
        </div>
        <EstadoPedido status={order.status} />
      </div>

      <ul className="mt-5 flex flex-col gap-1.5">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 text-sm">
            <span className="text-tenue">
              {item.product.name} × {item.quantity}
            </span>
            <span className="shrink-0 text-tinta tabular-nums">
              {formatPrice(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-between border-t border-borde pt-4">
        <span className="text-tenue">Total</span>
        <span className="text-2xl font-semibold text-tinta">{formatPrice(order.total)}</span>
      </div>
    </section>
  );
}

function EstadoPedido({ status }: { status: Order["status"] }) {
  const etiquetas: Record<Order["status"], string> = {
    pendiente: "Pendiente de pago",
    pagado: "Pagado",
    enviado: "Enviado",
    cancelado: "Cancelado",
  };

  const pagado = status === "pagado";

  return (
    <span
      className={`rounded-pieza px-2.5 py-1 text-xs uppercase tracking-[0.12em] ${
        pagado ? "bg-marca-suave text-marca-texto" : "border border-borde text-tenue"
      }`}
    >
      {etiquetas[status]}
    </span>
  );
}

function Marco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Contenedor ancho="angosto" className="py-16 sm:py-24">
      <h1 className="text-titulo text-tinta">{titulo}</h1>
      <div className="mt-5">{children}</div>
    </Contenedor>
  );
}
