import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

// GET /api/products?category=banco
export async function getProducts(req: Request, res: Response) {
  const { category } = req.query;

  const products = await prisma.product.findMany({
    where: typeof category === "string" && category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
  });

  res.json(products);
}

// GET /api/products/:slug
export async function getProductBySlug(req: Request, res: Response) {
  const product = await prisma.product.findUnique({
    where: { slug: String(req.params.slug) },
  });

  if (!product) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  res.json(product);
}
