import { Router } from "express";
import { iniciarSesion, sesionActual } from "../controllers/auth.controller.js";
import { requiereAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", iniciarSesion);
router.get("/me", requiereAdmin, sesionActual);

export default router;
