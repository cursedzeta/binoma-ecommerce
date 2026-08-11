import type { Request, Response } from "express";
import { firmaWebhookEsValida, obtenerPago } from "../services/mercadopago.service.js";
import { confirmarPedidoPagado } from "../services/pedidos.service.js";

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

  // Mercado Pago manda cada evento por DOS canales a la vez:
  //
  //   Webhook (moderno):  ?data.id=123&type=payment      + header x-signature
  //   IPN (legacy):       ?id=123&topic=payment          sin firma
  //
  // Los IPN no se pueden verificar —no llevan firma— asi que no los usamos.
  // Pero hay que responderles 200: con un 401, Mercado Pago los reintenta cada
  // 15 minutos para siempre, por algo que nunca vamos a aceptar.
  //
  // Responder 200 sin actuar es seguro: no tocamos nada. El evento igual nos
  // llega por el canal firmado, y si ese fallara, esta la reconciliacion.
  const esIPN = !tipo && typeof req.query.topic === "string";

  if (esIPN) {
    return res.status(200).json({ ignorado: "notificación IPN sin firma" });
  }

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

  // Un pago rechazado o pendiente no cambia nada: el pedido sigue esperando.
  if (pago.status !== "approved") {
    console.log(`Webhook: pago ${paymentId} en estado "${pago.status}", sin cambios.`);
    return res.status(200).json({ ok: true, status: pago.status });
  }

  // La confirmacion vive en pedidos.service y la comparte con la
  // reconciliacion: la parte donde se mueve la plata esta escrita una sola vez.
  const resultado = await confirmarPedidoPagado(pago.externalReference, pago.id);

  if (resultado.estado === "sin-pedido") {
    console.warn(`Webhook: no existe el pedido ${pago.externalReference}`);
    return res.status(200).json({ ignorado: "pedido inexistente" });
  }

  res.status(200).json({
    ok: true,
    yaProcesado: resultado.estado === "ya-confirmado",
  });
}

// Segun el topico, el id del pago puede venir en el cuerpo en vez de la query.
function extraerIdDelCuerpo(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;

  const { data } = body as { data?: unknown };
  if (typeof data !== "object" || data === null) return undefined;

  const { id } = data as { id?: unknown };
  return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
}
