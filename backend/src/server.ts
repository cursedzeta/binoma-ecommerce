import "dotenv/config";
import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import productsRoutes from "./routes/products.routes.js";
import retornoRoutes from "./routes/retorno.routes.js";
import webhooksRoutes from "./routes/webhooks.routes.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { advertirSiElTokenEsDeProduccion } from "./services/mercadopago.service.js";
import { iniciarReconciliacionPeriodica } from "./services/reconciliacion.service.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS_ORIGIN acepta varios origenes separados por coma: en produccion conviven
// el dominio propio y el que asigna Vercel, y durante un deploy hay que
// permitir los dos. Sin valor, se permite cualquiera (solo util en desarrollo).
const origenesPermitidos = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: origenesPermitidos.length > 0 ? origenesPermitidos : true,
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "binoma-api" });
});

app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Fuera de /api a proposito: son URLs de navegador, no de la API. Solo hacen
// falta mientras PUBLIC_WEB_URL no apunte al frontend publico.
if (!process.env.PUBLIC_WEB_URL) {
  app.use("/compra", retornoRoutes);
}

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`BINOMA API escuchando en http://localhost:${PORT}`);
  void advertirSiElTokenEsDeProduccion();
  iniciarReconciliacionPeriodica();
});
