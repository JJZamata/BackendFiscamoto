//routes/production.routes.js
import express from "express";
import {
  createCompliantRecord,
  createNonCompliantRecord,
  getConformeByUser,
  getNoConformeByUser,
  getConformeDetail,
  getNoConformeDetail,
  updateCompliantRecordS3Url,
  updateNonCompliantRecordS3Url,
} from "../controllers/production.controller.js";

import { verifyToken, isFiscalizador } from "../middlewares/authJwt.js";

const router = express.Router();

// ========== ENDPOINTS POST (CREACIÓN) ==========

// Crear nueva acta conforme (con checklist y fotos)
router.post("/conforme", [verifyToken, isFiscalizador], createCompliantRecord);
router.post("/noconforme", [verifyToken, isFiscalizador], createNonCompliantRecord);

// ========== ENDPOINTS GET (CONSULTA) ==========

// Obtener actas conforme por usuario fiscalizador (paginado)
router.get("/conforme/user/:id", [verifyToken, isFiscalizador], getConformeByUser);

// Obtener actas no conforme por usuario fiscalizador (paginado)
router.get("/noconforme/user/:id", [verifyToken, isFiscalizador], getNoConformeByUser);

// Obtener detalle de un acta conforme
router.get("/conforme/:actaId", [verifyToken, isFiscalizador], getConformeDetail);

// Obtener detalle de un acta no conforme
router.get("/noconforme/:actaId", [verifyToken, isFiscalizador], getNoConformeDetail);

// ========== ENDPOINTS PUT/PATCH (ACTUALIZACIÓN) ==========

// Actualizar S3 File URL para acta conforme
router.patch("/conforme/:actaId/s3-url", [verifyToken, isFiscalizador], updateCompliantRecordS3Url);

// Actualizar S3 File URL para acta no conforme
router.patch("/noconforme/:actaId/s3-url", [verifyToken, isFiscalizador], updateNonCompliantRecordS3Url);

export default router;