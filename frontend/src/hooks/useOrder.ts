import { useEffect, useState } from "react";
import type { Order } from "../types";
import { getOrderById } from "../services/api";

// Mercado Pago confirma el pago por webhook, que puede tardar unos segundos en
// llegar. En vez de mostrar "pendiente" y obligar a recargar, reconsultamos
// hasta que el pedido cambie de estado o se agote la paciencia.
const INTERVALO_MS = 3000;
const MAX_INTENTOS = 10;

type EstadoConsulta = {
  order: Order | null;
  loading: boolean;
  error: string | null;
  /** true mientras seguimos esperando que el webhook confirme. */
  esperandoConfirmacion: boolean;
};

export function useOrder(orderId: string | null): EstadoConsulta {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState<string | null>(null);
  const [agotado, setAgotado] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Misma guarda que en useProducts, y acá pesa más: con el polling hay
    // varias peticiones en vuelo y todas quieren escribir el estado.
    let vigente = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let intentos = 0;

    setLoading(true);
    setError(null);
    setAgotado(false);

    async function consultar() {
      intentos += 1;

      try {
        const datos = await getOrderById(orderId!);
        if (!vigente) return;

        setOrder(datos);
        setLoading(false);

        // Ya se resolvió: no tiene sentido seguir preguntando.
        if (datos.status !== "pendiente") return;

        if (intentos >= MAX_INTENTOS) {
          setAgotado(true);
          return;
        }

        timer = setTimeout(consultar, INTERVALO_MS);
      } catch (err) {
        if (!vigente) return;
        setError(err instanceof Error ? err.message : "Error desconocido");
        setLoading(false);
      }
    }

    void consultar();

    return () => {
      vigente = false;
      // Sin esto el timer sigue vivo después de salir de la página.
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  return {
    order,
    loading,
    error,
    esperandoConfirmacion: order?.status === "pendiente" && !agotado,
  };
}
