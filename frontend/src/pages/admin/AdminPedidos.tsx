import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { formatPrice } from "../../lib/format";
import {
  ApiError,
  cambiarEstadoPedido,
  getPedidosAdmin,
  getResumenPedidos,
  reconciliarPedido,
  type ResumenEstado,
} from "../../services/api";
import type { Order } from "../../types";

const ESTADOS = ["pendiente", "pagado", "enviado", "cancelado"] as const;

const ETIQUETAS: Record<string, string> = {
  pendiente: "Pendiente de pago",
  pagado: "Pagado",
  enviado: "Enviado",
  cancelado: "Cancelado",
};

export default function AdminPedidos() {
  const { logout } = useAuth();

  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [resumen, setResumen] = useState<ResumenEstado[]>([]);
  const [filtro, setFiltro] = useState<string | undefined>(undefined);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const [lista, totales] = await Promise.all([
        getPedidosAdmin(filtro),
        getResumenPedidos(),
      ]);
      setPedidos(lista);
      setResumen(totales);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los pedidos");
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function onCambiarEstado(id: string, status: string) {
    setOcupado(id);
    setAviso(null);

    try {
      await cambiarEstadoPedido(id, status);
      await cargar();
    } catch (err) {
      setAviso(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
    } finally {
      setOcupado(null);
    }
  }

  async function onVerificarPago(id: string) {
    setOcupado(id);
    setAviso(null);

    try {
      const r = await reconciliarPedido(id);

      setAviso(
        r.estado === "confirmado"
          ? `Pago confirmado (${r.paymentId}). El pedido pasó a pagado y se descontó el stock.`
          : r.estado === "ya-confirmado"
            ? "Este pedido ya estaba confirmado."
            : "Mercado Pago todavía no registra un pago aprobado para este pedido.",
      );

      await cargar();
    } catch (err) {
      setAviso(err instanceof ApiError ? err.message : "No se pudo verificar el pago");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-neutral-900">Pedidos</h1>
          <p className="text-sm text-neutral-600">Panel de administración de BINOMA</p>
        </div>
        <button onClick={logout} className="text-sm text-neutral-600 underline">
          Cerrar sesión
        </button>
      </header>

      <section className="mt-8 flex flex-wrap gap-4">
        {resumen.map((r) => (
          <div key={r.status} className="border border-neutral-300 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {ETIQUETAS[r.status] ?? r.status}
            </p>
            <p className="mt-1 text-neutral-900">
              {r.cantidad} {r.cantidad === 1 ? "pedido" : "pedidos"}
            </p>
            <p className="text-sm text-neutral-600">{formatPrice(r.total)}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        <Filtro activo={!filtro} onClick={() => setFiltro(undefined)}>
          Todos
        </Filtro>
        {ESTADOS.map((e) => (
          <Filtro key={e} activo={filtro === e} onClick={() => setFiltro(e)}>
            {ETIQUETAS[e]}
          </Filtro>
        ))}
      </div>

      {aviso && (
        <p role="status" className="mt-6 border border-neutral-400 p-3 text-sm text-neutral-800">
          {aviso}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-6 border border-neutral-500 p-3 text-sm text-neutral-900">
          {error}
        </p>
      )}

      {cargando && <p className="mt-8 text-neutral-500">Cargando pedidos...</p>}

      {!cargando && pedidos.length === 0 && (
        <p className="mt-8 text-neutral-500">No hay pedidos en esta vista.</p>
      )}

      <ul className="mt-8 divide-y divide-neutral-300 border-y border-neutral-300">
        {pedidos.map((pedido) => (
          <li key={pedido.id} className="py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-neutral-900">{pedido.customerName}</p>
                <p className="text-sm text-neutral-600">
                  {pedido.email} · {pedido.phone}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {new Date(pedido.createdAt).toLocaleString("es-AR")} · {pedido.id.slice(0, 8)}
                </p>
              </div>

              <div className="text-right">
                <span className="border border-neutral-400 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-700">
                  {ETIQUETAS[pedido.status] ?? pedido.status}
                </span>
                <p className="mt-2 text-lg text-neutral-900">{formatPrice(pedido.total)}</p>
              </div>
            </div>

            <ul className="mt-3 space-y-0.5">
              {pedido.items.map((item) => (
                <li key={item.id} className="text-sm text-neutral-700">
                  {item.quantity} × {item.product.name} — {formatPrice(item.price)} c/u
                </li>
              ))}
            </ul>

            <p className="mt-2 text-xs text-neutral-500">
              {pedido.mpPaymentId
                ? `Pago verificado: ${pedido.mpPaymentId}`
                : "Sin pago confirmado por Mercado Pago"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {pedido.status === "pendiente" && (
                <Accion
                  onClick={() => onVerificarPago(pedido.id)}
                  disabled={ocupado === pedido.id}
                >
                  Verificar pago
                </Accion>
              )}

              {pedido.status === "pagado" && (
                <Accion
                  onClick={() => onCambiarEstado(pedido.id, "enviado")}
                  disabled={ocupado === pedido.id}
                >
                  Marcar enviado
                </Accion>
              )}

              {pedido.status === "enviado" && (
                <Accion
                  onClick={() => onCambiarEstado(pedido.id, "pagado")}
                  disabled={ocupado === pedido.id}
                >
                  Deshacer envío
                </Accion>
              )}

              {pedido.status !== "cancelado" && pedido.status !== "enviado" && (
                <Accion
                  onClick={() => onCambiarEstado(pedido.id, "cancelado")}
                  disabled={ocupado === pedido.id}
                >
                  Cancelar
                </Accion>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

function Filtro({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`border px-3 py-1 text-sm ${
        activo
          ? "border-neutral-900 text-neutral-900"
          : "border-neutral-300 text-neutral-600 hover:border-neutral-500"
      }`}
    >
      {children}
    </button>
  );
}

function Accion({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="border border-neutral-900 px-3 py-1.5 text-sm text-neutral-900 disabled:border-neutral-300 disabled:text-neutral-400"
    >
      {children}
    </button>
  );
}
