// routes/records.routes.js
import express from "express";
import {
  getAllRecords,
  getRecordDetail
} from "../controllers/records.controller.js";

import { verifyToken, isAdmin } from "../middlewares/authJwt.js";

const router = express.Router();

// ========== ENDPOINTS GET (CONSULTA DE ACTAS) ==========

/**
 * GET /api/records
 * Obtener todas las actas (conformes y no conformes) con paginado, búsqueda y filtros
 * Query Parameters:
 * - page: número de página (default: 1)
 * - limit: límite por página (default: 6)
 * - search: término de búsqueda (busca en vehiclePlate, location, observations)
 * - type: tipo de acta ('all', 'conforme', 'noconforme') (default: 'all')
 * - sortBy: campo para ordenar ('createdAt', 'inspectionDateTime', 'vehiclePlate') (default: 'createdAt')
 * - sortOrder: orden ('ASC', 'DESC') (default: 'DESC')
 */
router.get("/", [verifyToken, isAdmin], getAllRecords);

/**
 * GET /api/records/:recordId/detail
 * Obtener detalle completo de un acta específica
 * Query Parameters:
 * - type: tipo de acta ('conforme' o 'noconforme') - REQUERIDO
 */
router.get("/:recordId/detail", [verifyToken, isAdmin], getRecordDetail);

export default router;