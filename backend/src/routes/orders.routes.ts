import { Router } from "express";
import {
  createOrder,
  getOrderById,
  reconciliarOrder,
} from "../controllers/orders.controller.js";

const router = Router();

router.post("/", createOrder);
router.get("/:id", getOrderById);
router.post("/:id/reconciliar", reconciliarOrder);

export default router;
