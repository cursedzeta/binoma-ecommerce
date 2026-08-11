import { Router } from "express";
import { createOrder, getOrderById } from "../controllers/orders.controller.js";

const router = Router();

router.post("/", createOrder);
router.get("/:id", getOrderById);

// La reconciliacion manual vive en /api/admin/orders/:id/reconciliar, detras
// del login: dispara llamadas a la API de Mercado Pago y no hay razon para que
// sea publica.

export default router;
