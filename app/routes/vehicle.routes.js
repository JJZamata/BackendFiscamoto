// routes/vehicle.routes.js
import express from "express";
import { 
  getVehiclesList, 
  getVehiclesStats, 
  getVehicleById 
} from "../controllers/vehicle.controller.js";
import { verifyToken, isAdminOrFiscalizador } from "../middlewares/authJwt.js";
import { generalLimiter } from "../config/rateLimiter.config.js";
import { 
  validateVehicleQuery,
  validateVehicleByPlate,
  validateVehicleStatsQuery,
  sanitizeVehicleQuery,
  logVehicleQuery
} from "../middlewares/vehicleValidation.js";

const router = express.Router();

// GET /api/vehicles - Obtener listado paginado de vehículos
router.get("/", [
  verifyToken,
  isAdminOrFiscalizador,
  generalLimiter,
  logVehicleQuery,              // Log para debugging
  sanitizeVehicleQuery,         // Sanitizar y valores por defecto
  validateVehicleQuery          // Validaciones con express-validator
], getVehiclesList);

// GET /api/vehicles/stats - Obtener estadísticas de vehículos
router.get("/stats", [
  verifyToken,
  isAdminOrFiscalizador,
  generalLimiter,
  logVehicleQuery,
  validateVehicleStatsQuery     // Validaciones para estadísticas
], getVehiclesStats);

// GET /api/vehicles/:plateNumber - Obtener vehículo específico por número de placa
router.get("/:plateNumber", [
  verifyToken,
  isAdminOrFiscalizador,
  generalLimiter,
  logVehicleQuery,
  validateVehicleByPlate        // Validación de placa específica
], getVehicleById);

export default router;