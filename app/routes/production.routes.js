import express from "express";
import {
  getConformeByUser,
  getNoConformeByUser,
  getConformeDetail,
  getNoConformeDetail
} from "../controllers/production.controller.js";

import { verifyToken, isFiscalizador } from "../middlewares/authJwt.js";

const router = express.Router();

// Obtener actas conforme por usuario fiscalizador (paginado)
router.get("/conforme/user/:id", /*[verifyToken, isFiscalizador,generalLimiter], */getConformeByUser);

// Obtener actas no conforme por usuario fiscalizador (paginado)
router.get("/noconforme/user/:id", /*[verifyToken, isFiscalizador,generalLimiter], */getNoConformeByUser);

// Obtener detalle de un acta conforme
router.get("/conforme/:actaId",/* [verifyToken, isFiscalizador,generalLimiter], */getConformeDetail);

// Obtener detalle de un acta no conforme
router.get("/noconforme/:actaId",/* [verifyToken, isFiscalizador,generalLimiter], */getNoConformeDetail);

export default router;