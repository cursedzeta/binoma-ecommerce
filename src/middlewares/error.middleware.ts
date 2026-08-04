import type { NextFunction, Request, Response } from "express";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Ruta no encontrada" });
}

// Express 5 reenvía automáticamente los errores de handlers async a este middleware.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);
  const message = err instanceof Error ? err.message : "Error interno del servidor";
  res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "Error interno del servidor" : message,
  });
}
