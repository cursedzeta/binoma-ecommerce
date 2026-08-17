import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { generarSlug, validarProducto } from "../lib/validarProducto.js";

// ABM de productos para el panel. Todo detras de requiereAdmin.
//
// A diferencia del catalogo publico, aca se devuelven los productos completos,
// incluidos los que estan sin stock: el dueño necesita verlos para reponerlos.

// Un pedido cancelado no es una venta: no tiene por que trabar el catalogo.
// Los pendientes SI cuentan, porque todavia pueden pagarse.
const PEDIDOS_VIGENTES = { order: { status: { not: "cancelado" } } } as const;

const conConteoDePedidos = {
  _count: { select: { orderItems: { where: PEDIDOS_VIGENTES } } },
} as const;

// GET /api/admin/products
export async function listarProductos(_req: Request, res: Response) {
  const productos = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: conConteoDePedidos,
  });

  res.json(productos);
}

// GET /api/admin/products/categorias
// Las categorias que ya existen, para sugerirlas en el formulario en vez de que
// el dueño las escriba de memoria y termine con "mesa" y "mesas".
export async function listarCategorias(_req: Request, res: Response) {
  const filas = await prisma.product.groupBy({
    by: ["category"],
    _count: { _all: true },
    orderBy: { category: "asc" },
  });

  res.json(filas.map((f) => ({ category: f.category, cantidad: f._count._all })));
}

// POST /api/admin/products
export async function crearProducto(req: Request, res: Response) {
  const validacion = validarProducto(req.body);

  if (!validacion.ok) {
    return res.status(400).json({
      error: "El producto tiene errores",
      detalles: validacion.errores,
    });
  }

  const datos = { ...validacion.datos, slug: await slugLibre(validacion.datos.slug) };

  const producto = await prisma.product.create({ data: datos });

  res.status(201).json(producto);
}

// PATCH /api/admin/products/:id
export async function editarProducto(req: Request, res: Response) {
  const existente = await prisma.product.findUnique({ where: { id: String(req.params.id) } });

  if (!existente) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  const validacion = validarProducto({ ...existente, ...(req.body as object) });

  if (!validacion.ok) {
    return res.status(400).json({
      error: "El producto tiene errores",
      detalles: validacion.errores,
    });
  }

  const { slug, ...resto } = validacion.datos;

  const producto = await prisma.product.update({
    where: { id: existente.id },
    data: {
      ...resto,
      // Cambiar el slug rompe los enlaces que ya circulan por WhatsApp o que
      // Google indexo, asi que solo se toca si lo piden explicitamente.
      ...(slug !== existente.slug ? { slug: await slugLibre(slug, existente.id) } : {}),
    },
  });

  res.json(producto);
}

// DELETE /api/admin/products/:id
export async function borrarProducto(req: Request, res: Response) {
  const producto = await prisma.product.findUnique({
    where: { id: String(req.params.id) },
    include: conConteoDePedidos,
  });

  if (!producto) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  // Un producto que aparece en pedidos vigentes no se borra: esos pedidos
  // quedarian sin poder mostrar que se vendio. Para sacarlo de la tienda
  // alcanza con dejarlo en stock 0.
  //
  // Los cancelados no cuentan: no son ventas, y dejarlos trabar el catalogo
  // significaria que un pedido de prueba te clava un producto para siempre.
  if (producto._count.orderItems > 0) {
    return res.status(409).json({
      error:
        "Este producto aparece en pedidos vigentes y no se puede borrar. Poné su stock en 0 para sacarlo de la tienda, o cancelá esos pedidos.",
    });
  }

  // Las lineas de los pedidos cancelados apuntan al producto, y la base bloquea
  // el borrado mientras existan. Se van con el producto, en una sola operacion:
  // si algo falla, no queda ni el producto a medio borrar ni lineas huerfanas.
  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { productId: producto.id } }),
    prisma.product.delete({ where: { id: producto.id } }),
  ]);

  res.status(204).end();
}

/**
 * Devuelve un slug que no choque con otro producto, agregando -2, -3, etc.
 *
 * Sin esto, cargar dos "Mesa Ratona" reventaria con un error de base de datos
 * incomprensible para quien esta cargando productos.
 */
async function slugLibre(base: string, ignorarId?: string): Promise<string> {
  const limpio = generarSlug(base);
  let candidato = limpio;

  for (let n = 2; n < 100; n++) {
    const chocan = await prisma.product.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });

    if (!chocan || chocan.id === ignorarId) return candidato;

    candidato = `${limpio}-${n}`;
  }

  // Escape improbable: 99 productos con el mismo nombre.
  return `${limpio}-${Date.now()}`;
}
