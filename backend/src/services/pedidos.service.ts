import { prisma } from "../lib/prisma.js";

// Confirmar un pedido es la operacion donde se mueve la plata y la mercaderia,
// asi que esta escrita UNA sola vez. La usan los dos caminos que pueden
// enterarse de un pago:
//
//   webhook          -> Mercado Pago avisa (rapido, pero puede no llegar)
//   reconciliacion   -> nosotros preguntamos (lento, pero no falla)
//
// Que compartan esta funcion es lo que garantiza que un pedido confirmado por
// un camino quede exactamente igual que uno confirmado por el otro.

export type Confirmacion =
  | { estado: "confirmado"; orderId: string; paymentId: string }
  | { estado: "ya-confirmado"; orderId: string }
  | { estado: "sin-pedido"; orderId: string };

/**
 * Marca el pedido como pagado y descuenta el stock.
 *
 * Es idempotente: si el pedido ya salio de "pendiente", no toca nada. Hace
 * falta porque Mercado Pago reintenta las notificaciones y porque la
 * reconciliacion puede cruzarse con un webhook que llego justo antes.
 */
export async function confirmarPedidoPagado(
  orderId: string,
  paymentId: string,
): Promise<Confirmacion> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return { estado: "sin-pedido", orderId };
  }

  if (order.status !== "pendiente") {
    return { estado: "ya-confirmado", orderId };
  }

  // El cambio de estado y el descuento de stock van juntos o no van: un pedido
  // no puede quedar cobrado sin haber reservado la mercaderia.
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "pagado", mpPaymentId: paymentId },
    }),
    ...order.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      }),
    ),
  ]);

  console.log(`Pedido ${order.id} pagado (pago ${paymentId}). Stock descontado.`);

  return { estado: "confirmado", orderId: order.id, paymentId };
}
