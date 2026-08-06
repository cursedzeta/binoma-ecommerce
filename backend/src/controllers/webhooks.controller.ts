import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { firmaWebhookEsValida, obtenerPago } from "../services/mercadopago.service.js";

// POST /api/webhooks/mercadopago
//
// El unico lugar de todo el sistema que marca un pedido como pagado.
//
// Tres reglas que sostienen esto:
//
// 1. Del cuerpo del aviso solo se toma el ID del pago. El "status" que venga
//    ahi se ignora: la notificacion dice que PASO algo, no QUE paso.
// 2. Antes de mirar nada se verifica la firma. Sin eso, cualquiera puede
//    mandar un POST y llevarse un mueble gratis.
// 3. Mercado Pago reintenta: el mismo pago puede llegar varias veces. Si el
//    pedido ya esta pagado, se responde OK y no se toca nada.
export async function recibirWebhookMercadoPago(req: Request, res: Response) {
  // data.id viene por query string; el punto es parte del nombre.
  const dataId = typeof req.query["data.id"] === "string" ? req.query["data.id"] : undefined;
  const tipo = typeof req.query.type === "string" ? req.query.type : undefined;

  const firmaOk = firmaWebhookEsValida({
    xSignature: req.header("x-signature") ?? undefined,
    xRequestId: req.header("x-request-id") ?? undefined,
    dataId,
  });

  if (!firmaOk) {
    console.warn("Webhook rechazado: firma inválida o ausente.", { tipo, dataId });
    return res.status(401).json({ error: "Firma inválida" });
  }

  // Checkout Pro tambien notifica merchant_order y otros topicos. Solo nos
  // interesan los pagos; al resto le respondemos 200 para que no reintente.
  if (tipo !== "payment") {
    return res.status(200).json({ ignorado: tipo ?? "sin tipo" });
  }

  const paymentId = dataId ?? extraerIdDelCuerpo(req.body);

  if (!paymentId) {
    return res.status(200).json({ ignorado: "sin id de pago" });
  }

  // Acá se le pregunta a Mercado Pago qué pasó de verdad.
  const pago = await obtenerPago(paymentId);

  if (!pago) {
    console.warn(`Webhook: Mercado Pago no reconoce el pago ${paymentId}`);
    return res.status(200).json({ ignorado: "pago inexistente" });
  }

  if (!pago.externalReference) {
    console.warn(`Webhook: el pago ${paymentId} no trae external_reference`);
    return res.status(200).json({ ignorado: "sin pedido asociado" });
  }

  const order = await prisma.order.findUnique({
    where: { id: pago.externalReference },
    include: { items: true },
  });

  if (!order) {
    console.warn(`Webhook: no existe el pedido ${pago.externalReference}`);
    return res.status(200).json({ ignorado: "pedido inexistente" });
  }

  // Un pago rechazado o pendiente no cambia nada: el pedido sigue esperando.
  if (pago.status !== "approved") {
    console.log(`Webhook: pago ${paymentId} en estado "${pago.status}", sin cambios.`);
    return res.status(200).json({ ok: true, status: pago.status });
  }

  // Idempotencia: si ya lo procesamos, no volver a descontar stock.
  if (order.status !== "pendiente") {
    return res.status(200).json({ ok: true, yaProcesado: true });
  }

  // Marcar como pagado y descontar stock van juntos o no van: si el descuento
  // falla, el pedido no puede quedar cobrado sin haber reservado la mercadería.
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "pagado", mpPaymentId: pago.id },
    }),
    ...order.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      }),
    ),
  ]);

  console.log(`Pedido ${order.id} pagado (pago ${pago.id}). Stock descontado.`);

  res.status(200).json({ ok: true });
}

// Segun el topico, el id del pago puede venir en el cuerpo en vez de la query.
function extraerIdDelCuerpo(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;

  const { data } = body as { data?: unknown };
  if (typeof data !== "object" || data === null) return undefined;

  const { id } = data as { id?: unknown };
  return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
}
