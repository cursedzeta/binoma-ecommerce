import { Router } from "express";
import { recibirWebhookMercadoPago } from "../controllers/webhooks.controller.js";

const router = Router();

router.post("/mercadopago", recibirWebhookMercadoPago);

export default router;
