import type { Request, Response } from "express";
import { authEstaConfigurada, login } from "../services/auth.service.js";

// POST /api/auth/login
export async function iniciarSesion(req: Request, res: Response) {
  if (!authEstaConfigurada()) {
    return res.status(503).json({
      error: "El panel de administración no está configurado en el servidor",
    });
  }

  const { email, password } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return res.status(400).json({ error: "Email y contraseña son obligatorios" });
  }

  const token = await login(email, password);

  if (!token) {
    // Mismo mensaje para email inexistente y contraseña incorrecta: distinguir
    // le diria a un atacante que ese email es el bueno.
    return res.status(401).json({ error: "Email o contraseña incorrectos" });
  }

  res.json({ token });
}

// GET /api/auth/me
// El frontend lo usa al cargar para saber si la sesión guardada sigue viva.
export function sesionActual(req: Request, res: Response) {
  res.json({ admin: req.admin });
}
