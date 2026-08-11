import { Router } from "express";

// Puente de desarrollo para las back_urls de Mercado Pago.
//
// Mercado Pago exige que las URLs de retorno sean HTTPS publicas y rechaza
// localhost. En produccion eso lo cubre el dominio del frontend (Vercel), pero
// en desarrollo haria falta un segundo tunel de ngrok, y el plan gratuito solo
// permite uno.
//
// La solucion: las back_urls apuntan al tunel del backend, que ya existe, y
// estas rutas devuelven al comprador a la tienda local conservando los
// parametros que agrega Mercado Pago (external_reference, payment_id, etc).
// Funciona porque durante las pruebas el navegador del comprador es el mismo
// que corre la tienda.
//
// Estas rutas NO confirman ningun pago: solo redirigen. Quien cambia el estado
// de un pedido es el webhook o la reconciliacion.

const router = Router();

const RESULTADOS = new Set(["exitosa", "fallida", "pendiente"]);

router.get("/:resultado", (req, res) => {
  const { resultado } = req.params;

  if (!RESULTADOS.has(resultado)) {
    return res.status(404).json({ error: "Resultado de compra desconocido" });
  }

  const tienda = (process.env.CORS_ORIGIN ?? "http://localhost:5173").replace(/\/$/, "");

  const query = new URLSearchParams(
    Object.entries(req.query).flatMap(([clave, valor]) =>
      typeof valor === "string" ? [[clave, valor] as [string, string]] : [],
    ),
  ).toString();

  res.redirect(302, `${tienda}/compra/${resultado}${query ? `?${query}` : ""}`);
});

export default router;
