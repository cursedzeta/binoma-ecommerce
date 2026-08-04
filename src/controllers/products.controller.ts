import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

// priceRetail es la lista mayorista: queda en la base para uso interno,
// pero nunca sale por los endpoints publicos.
const publicFields = { priceRetail: true } as const;

// GET /api/products?category=banco
export async function getProducts(req: Request, res: Response) {
  const { category } = req.query;

  const products = await prisma.product.findMany({
    where: typeof category === "string" && category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
    omit: publicFields,
  });

  res.json(products);
}

// GET /api/products/:slug
export async function getProductBySlug(req: Request, res: Response) {
  const product = await prisma.product.findUnique({
    where: { slug: String(req.params.slug) },
    omit: publicFields,
  });

  if (!product) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  res.json(product);
}
