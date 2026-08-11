import { Router } from "express";
import {
  cambiarEstado,
  listarPedidos,
  resumen,
} from "../controllers/admin.orders.controller.js";
import { reconciliarOrder } from "../controllers/orders.controller.js";
import { requiereAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Una sola linea protege todo lo que sigue. Asi ninguna ruta puede quedar
// abierta por olvido.
router.use(requiereAdmin);

router.get("/orders", listarPedidos);
router.get("/orders/resumen", resumen);
router.patch("/orders/:id/estado", cambiarEstado);

// Reusa el mismo controller que el endpoint publico de reconciliacion: es el
// boton "Verificar pago" del panel.
router.post("/orders/:id/reconciliar", reconciliarOrder);

export default router;
