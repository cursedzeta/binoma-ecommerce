import { prisma } from "../lib/prisma.js";
import { buscarPagoAprobadoDePedido, estaConfigurado } from "./mercadopago.service.js";
import { confirmarPedidoPagado } from "./pedidos.service.js";

// Red de seguridad para cuando el webhook no llega.
//
// Los webhooks fallan por razones normales: se cae el servidor unos minutos,
// se corta internet, Mercado Pago tiene un incidente, o la URL configurada
// quedo vieja. Si la unica forma de enterarse de un cobro fuera que nos avisen
// en ese instante, tarde o temprano un cliente paga y no recibe nada.
//
// Este proceso da vuelta la pregunta: en vez de esperar el aviso, cada tantos
// minutos revisa los pedidos que siguen pendientes y le pregunta a Mercado
// Pago si alguien los pago.
//
// Con esto el webhook pasa a ser una optimizacion de latencia (confirma en
// segundos en vez de en minutos), no un requisito para cobrar bien.

const INTERVALO_MS = Number(process.env.RECONCILIACION_INTERVALO_MS) || 2 * 60 * 1000;

// Ventana hacia atras. Un pedido que sigue pendiente despues de un dia es un
// carrito abandonado, no un pago que se perdio: revisarlo para siempre seria
// gastar llamadas a la API sin sentido.
const VENTANA_HORAS = Number(process.env.RECONCILIACION_VENTANA_HORAS) || 24;

// Tope por corrida, para no disparar cientos de llamadas si algo se acumulo.
const MAX_POR_CORRIDA = 20;

export type ResumenReconciliacion = {
  revisados: number;
  confirmados: number;
  errores: number;
};

/**
 * Revisa los pedidos pendientes recientes y confirma los que ya estan pagados.
 *
 * Nunca marca nada por su cuenta: para cada pedido le pregunta a Mercado Pago
 * si existe un pago aprobado, igual que hace el webhook. La confirmacion pasa
 * por confirmarPedidoPagado(), la misma funcion que usa el webhook.
 */
export async function reconciliarPendientes(): Promise<ResumenReconciliacion> {
  const resumen: ResumenReconciliacion = { revisados: 0, confirmados: 0, errores: 0 };

  if (!estaConfigurado()) return resumen;

  const desde = new Date(Date.now() - VENTANA_HORAS * 60 * 60 * 1000);

  const pendientes = await prisma.order.findMany({
    where: {
      status: "pendiente",
      createdAt: { gte: desde },
      // Sin preferencia nunca se inicio un pago: no hay nada que buscar.
      mpPreferenceId: { not: null },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: MAX_POR_CORRIDA,
  });

  for (const { id } of pendientes) {
    resumen.revisados += 1;

    try {
      const pago = await buscarPagoAprobadoDePedido(id);
      if (!pago) continue;

      const resultado = await confirmarPedidoPagado(id, pago.id);

      if (resultado.estado === "confirmado") {
        resumen.confirmados += 1;
        console.log(`Reconciliación: pedido ${id} confirmado con el pago ${pago.id}.`);
      }
    } catch (err) {
      // Un pedido que falla no puede cortar la revision de los demas.
      resumen.errores += 1;
      console.error(`Reconciliación: error revisando el pedido ${id}:`, err);
    }
  }

  return resumen;
}

/**
 * Reconcilia un pedido puntual. Pensado para cuando un cliente reclama que
 * pago y su pedido figura pendiente: se resuelve al instante sin esperar la
 * proxima corrida.
 */
export async function reconciliarPedido(orderId: string) {
  const pago = await buscarPagoAprobadoDePedido(orderId);

  if (!pago) {
    return { estado: "sin-pago-aprobado" as const, orderId };
  }

  return confirmarPedidoPagado(orderId, pago.id);
}

let temporizador: ReturnType<typeof setInterval> | undefined;

export function iniciarReconciliacionPeriodica() {
  if (!estaConfigurado()) {
    console.log("Reconciliación desactivada: falta MP_ACCESS_TOKEN.");
    return;
  }

  if (temporizador) return;

  const minutos = (INTERVALO_MS / 60000).toFixed(1);
  console.log(`Reconciliación activa: cada ${minutos} min, ventana ${VENTANA_HORAS}h.`);

  const correr = () => {
    reconciliarPendientes().catch((err) =>
      console.error("Reconciliación: la corrida falló entera:", err),
    );
  };

  temporizador = setInterval(correr, INTERVALO_MS);
  // unref evita que este intervalo mantenga vivo el proceso al apagarlo.
  temporizador.unref?.();

  correr();
}
