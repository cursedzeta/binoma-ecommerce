import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

// Endpoints del panel de administracion para los pedidos. Todos van detras del
// middleware requiereAdmin: nada de esto es publico.

const ESTADOS = ["pendiente", "pagado", "enviado", "cancelado"] as const;
type Estado = (typeof ESTADOS)[number];

function esEstado(valor: unknown): valor is Estado {
  return typeof valor === "string" && (ESTADOS as readonly string[]).includes(valor);
}

// GET /api/admin/orders?status=pagado
export async function listarPedidos(req: Request, res: Response) {
  const { status } = req.query;

  const pedidos = await prisma.order.findMany({
    where: esEstado(status) ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    // Tope para que la pantalla no se vuelva impracticable cuando haya cientos.
    // Cuando haga falta, se agrega paginacion.
    take: 100,
    include: {
      items: {
        include: {
          product: { select: { slug: true, name: true, images: true } },
        },
      },
    },
  });

  res.json(pedidos);
}

// PATCH /api/admin/orders/:id/estado
export async function cambiarEstado(req: Request, res: Response) {
  const { status } = (req.body ?? {}) as Record<string, unknown>;

  if (!esEstado(status)) {
    return res.status(400).json({
      error: `Estado inválido. Los válidos son: ${ESTADOS.join(", ")}`,
    });
  }

  const pedido = await prisma.order.findUnique({ where: { id: String(req.params.id) } });

  if (!pedido) {
    return res.status(404).json({ error: "Pedido no encontrado" });
  }

  // Lo que hay que impedir es marcar como pagado un pedido SIN pago verificado.
  // mpPaymentId solo se completa cuando el webhook o la reconciliacion le
  // preguntaron a Mercado Pago y confirmaron. Si esta vacio, no hay plata.
  //
  // Volver a "pagado" un pedido que ya tiene su pago (por ejemplo, si se marcó
  // "enviado" por error) sí se permite: el cobro está verificado igual.
  if (status === "pagado" && !pedido.mpPaymentId) {
    return res.status(409).json({
      error:
        "Este pedido no tiene un pago confirmado. Usá 'Verificar pago' para consultarlo con Mercado Pago.",
    });
  }

  const actualizado = await prisma.order.update({
    where: { id: pedido.id },
    data: { status },
    include: {
      items: {
        include: {
          product: { select: { slug: true, name: true, images: true } },
        },
      },
    },
  });

  res.json(actualizado);
}

// GET /api/admin/orders/resumen
// Numeros para el encabezado del panel.
export async function resumen(_req: Request, res: Response) {
  const porEstado = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
    _sum: { total: true },
  });

  res.json(
    porEstado.map((fila) => ({
      status: fila.status,
      cantidad: fila._count._all,
      total: fila._sum.total ?? 0,
    })),
  );
}
