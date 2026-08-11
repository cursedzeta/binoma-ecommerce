import type { NextFunction, Request, Response } from "express";
import { verificarToken, type PayloadToken } from "../services/auth.service.js";

// Extiende el Request de Express para poder colgar el admin autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: PayloadToken;
    }
  }
}

/**
 * Corta el paso a cualquiera que no traiga un token valido.
 *
 * Se monta ANTES de las rutas de administracion, asi ninguna tiene que
 * acordarse de verificar por su cuenta. Olvidarse en una sola ruta seria dejar
 * el catalogo abierto a que cualquiera lo edite.
 */
export function requiereAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [esquema, token] = header.split(" ");

  if (esquema !== "Bearer" || !token) {
    return res.status(401).json({ error: "Falta el token de sesión" });
  }

  const admin = verificarToken(token);

  if (!admin) {
    // 401 y no 403: el token es invalido o vencio, asi que corresponde volver a
    // autenticarse. El frontend usa esto para mandar al login.
    return res.status(401).json({ error: "Sesión inválida o vencida" });
  }

  req.admin = admin;
  next();
}
