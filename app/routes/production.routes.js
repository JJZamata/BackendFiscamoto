import express from "express";
import {
  createCompliantRecord,
  getConformeByUser,
  getNoConformeByUser,
  getConformeDetail,
  getNoConformeDetail
} from "../controllers/production.controller.js";

import { verifyToken, isFiscalizador } from "../middlewares/authJwt.js";

const router = express.Router();

// ========== ENDPOINTS POST (CREACIÓN) ==========

// Crear nueva acta conforme (con checklist y fotos)
router.post("/conforme", [verifyToken, isFiscalizador], createCompliantRecord);

// ========== ENDPOINTS GET (CONSULTA) ==========

// Obtener actas conforme por usuario fiscalizador (paginado)
router.get("/conforme/user/:id", [verifyToken, isFiscalizador], getConformeByUser);

// Obtener actas no conforme por usuario fiscalizador (paginado)
router.get("/noconforme/user/:id", [verifyToken, isFiscalizador], getNoConformeByUser);

// Obtener detalle de un acta conforme
router.get("/conforme/:actaId", [verifyToken, isFiscalizador], getConformeDetail);

// Obtener detalle de un acta no conforme
router.get("/noconforme/:actaId", [verifyToken, isFiscalizador], getNoConformeDetail);

export default router;