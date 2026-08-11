import "dotenv/config";
import express from "express";
import cors from "cors";
import ordersRoutes from "./routes/orders.routes.js";
import productsRoutes from "./routes/products.routes.js";
import webhooksRoutes from "./routes/webhooks.routes.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { advertirSiElTokenEsDeProduccion } from "./services/mercadopago.service.js";
import { iniciarReconciliacionPeriodica } from "./services/reconciliacion.service.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "binoma-api" });
});

app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/webhooks", webhooksRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`BINOMA API escuchando en http://localhost:${PORT}`);
  void advertirSiElTokenEsDeProduccion();
  iniciarReconciliacionPeriodica();
});
