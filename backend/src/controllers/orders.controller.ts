import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { validarPedido } from "../lib/validarPedido.js";
import { crearPreferencia, estaConfigurado } from "../services/mercadopago.service.js";
import { reconciliarPedido } from "../services/reconciliacion.service.js";

// POST /api/orders
//
// Recibe QUE productos y CUANTOS. Nada mas. Si el cuerpo trae un "total" o un
// "price", se ignoran: los precios se leen de la base y el total lo calcula
// este controller. Sin esto, cualquiera edita el JSON en el DevTools y compra
// una mesa de comedor por un peso.
export async function createOrder(req: Request, res: Response) {
  const validacion = validarPedido(req.body);

  if (!validacion.ok) {
    return res.status(400).json({
      error: "El pedido tiene errores",
      detalles: validacion.errores,
    });
  }

  const { customerName, email, phone, items } = validacion.datos;

  // Una sola consulta para todos los productos del pedido.
  const productos = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, name: true, price: true, stock: true },
  });

  const porId = new Map(productos.map((p) => [p.id, p]));
  const problemas: string[] = [];

  for (const item of items) {
    const producto = porId.get(item.productId);

    if (!producto) {
      problemas.push("Uno de los productos del carrito ya no está disponible");
      continue;
    }

    if (producto.stock < item.quantity) {
      problemas.push(
        producto.stock === 0
          ? `${producto.name} se quedó sin stock`
          : `${producto.name}: quedan ${producto.stock} unidades y pediste ${item.quantity}`,
      );
    }
  }

  // 409 Conflict: el pedido esta bien formado, pero choca con el estado actual
  // del catalogo. Es distinto de un 400 (pedido mal armado).
  if (problemas.length > 0) {
    return res.status(409).json({
      error: "El pedido no se puede completar",
      detalles: problemas,
    });
  }

  // El precio se congela ACA, al crear el pedido. Si manana sube la lista, este
  // pedido conserva el precio que vio el cliente.
  const lineas = items.map((item) => {
    const producto = porId.get(item.productId)!;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: producto.price,
    };
  });

  const total = lineas.reduce((acc, l) => acc + l.price * l.quantity, 0);

  // Order y OrderItem se crean juntos: Prisma lo envuelve en una transaccion,
  // asi no puede quedar un pedido sin sus lineas.
  //
  // El stock NO se descuenta todavia. Se descuenta cuando Mercado Pago confirma
  // el pago (sprint 4, paso 5). Hasta entonces el pedido esta "pendiente" y la
  // mercaderia sigue disponible para otros.
  const order = await prisma.order.create({
    data: {
      customerName,
      email,
      phone,
      total,
      status: "pendiente",
      items: { create: lineas },
    },
    include: {
      items: {
        include: {
          product: { select: { slug: true, name: true, images: true } },
        },
      },
    },
  });

  // Sin credenciales de Mercado Pago el pedido igual se crea. Sirve para
  // desarrollo y para que los tests del calculo de totales no dependan de una
  // API externa.
  if (!estaConfigurado()) {
    return res.status(201).json({ order, checkoutUrl: null });
  }

  try {
    const { preferenceId, checkoutUrl } = await crearPreferencia({
      orderId: order.id,
      comprador: { nombre: order.customerName, email: order.email },
      items: order.items.map((item) => ({
        id: item.productId,
        title: item.product.name,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: preferenceId },
    });

    res.status(201).json({ order: { ...order, mpPreferenceId: preferenceId }, checkoutUrl });
  } catch (err) {
    // El pedido ya esta guardado como "pendiente": no se pierde. Devolvemos su
    // id para que el frontend pueda reintentar el pago sin recargarlo todo.
    console.error("Error creando la preferencia de Mercado Pago:", err);

    res.status(502).json({
      error: "No se pudo iniciar el pago. Tu pedido quedó guardado.",
      orderId: order.id,
    });
  }
}

// GET /api/orders/:id
// Sirve para la pantalla de "gracias por tu compra" y para consultar el estado.
export async function getOrderById(req: Request, res: Response) {
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    include: {
      items: {
        include: {
          product: { select: { slug: true, name: true, images: true } },
        },
      },
    },
  });

  if (!order) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  res.json(order);
}

// POST /api/orders/:id/reconciliar
//
// Le pregunta a Mercado Pago si este pedido ya esta pagado, sin esperar la
// corrida periodica. Sirve para cuando un cliente reclama que pagó y su pedido
// figura pendiente: se resuelve en el momento.
//
// No marca nada por su cuenta: si Mercado Pago no reporta un pago aprobado, el
// pedido queda como estaba.
export async function reconciliarOrder(req: Request, res: Response) {
  if (!estaConfigurado()) {
    return res.status(503).json({ error: "Mercado Pago no está configurado" });
  }

  const resultado = await reconciliarPedido(String(req.params.id));

  if (resultado.estado === "sin-pedido") {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  res.json(resultado);
}
