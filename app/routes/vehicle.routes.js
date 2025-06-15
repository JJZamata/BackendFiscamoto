// routes/vehicle.routes.js
import express from "express";

import {
  getVehiclesList,
  getVehiclesStats
} from "../controllers/vehicle.controller.js";

import {
  verifyToken,
  isAdminOrFiscalizador
} from "../middlewares/authJwt.js";

import { generalLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// Rutas para gestión de vehículos (requiere autenticación y rol de admin o fiscalizador)

/**
 * @route GET /api/vehicles
 * @description Obtener listado paginado de vehículos
 * @access Private (Admin/Fiscalizador)
 * @params {number} page - Número de página (default: 1)
 * @params {number} limit - Elementos por página (default: 6)
 * @params {string} search - Término de búsqueda (opcional)
 * @params {string} status - Filtro por estado (opcional)
 * @params {number} type - Filtro por tipo de vehículo (opcional)  //uso de Swageer? o solo Postman?
 */
router.get("/", [
  verifyToken,
  isAdminOrFiscalizador,
  generalLimiter
], getVehiclesList);

/**
 * @route GET /api/vehicles/stats
 * @description Obtener estadísticas de vehículos por estado
 * @access Private (Admin/Fiscalizador)
 */
router.get("/stats", [
  verifyToken,
  isAdminOrFiscalizador,
  generalLimiter
], getVehiclesStats);

export default router;