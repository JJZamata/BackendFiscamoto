// routes/vehicle.routes.js
import express from "express";
import { 
  getVehiclesList, 
  getVehiclesStats, 
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from "../controllers/vehicle.controller.js";
import { verifyToken, isAdminOrFiscalizador } from "../middlewares/authJwt.js";
import { generalLimiter } from "../config/rateLimiter.config.js";
import { 
  validateVehicleQuery,
  validateVehicleByPlate,
  validateVehicleStatsQuery,
  validateCreateVehicle,
  validateUpdateVehicle,
  sanitizeVehicleQuery,
  logVehicleQuery
} from "../middlewares/vehicleValidation.js";

const router = express.Router();

// GET /api/vehicles - Obtener listado paginado de vehículos
router.get("/", [
  /*verifyToken,
  isAdminOrFiscalizador,
  generalLimiter,
  logVehicleQuery,
  sanitizeVehicleQuery,*/
  validateVehicleQuery
], getVehiclesList);

// GET /api/vehicles/stats - Obtener estadísticas de vehículos
router.get("/stats", [
  verifyToken,
  isAdminOrFiscalizador,
  generalLimiter,
  logVehicleQuery,
  validateVehicleStatsQuery
], getVehiclesStats);

// GET /api/vehicles/:plateNumber - Obtener vehículo específico por número de placa
router.get("/:plateNumber", [
  /*verifyToken,*/
  /*isAdminOrFiscalizador,*/
  /*generalLimiter,*/
  logVehicleQuery,
  validateVehicleByPlate
], getVehicleById);

// POST /api/vehicles - Crear nuevo vehículo
router.post("/", [
  verifyToken,
  isAdminOrFiscalizador,
  generalLimiter,
  logVehicleQuery,
  validateCreateVehicle
], createVehicle);

// PUT /api/vehicles/:plateNumber - Actualizar vehículo completo
router.put("/:plateNumber", [
  verifyToken,
  isAdminOrFiscalizador,
  generalLimiter,
  logVehicleQuery,
  validateVehicleByPlate,
  validateUpdateVehicle
], updateVehicle);

// DELETE /api/vehicles/:plateNumber - Eliminar vehículo
router.delete("/:plateNumber", [
  verifyToken,
  isAdminOrFiscalizador,
  generalLimiter,
  logVehicleQuery,
  validateVehicleByPlate
], deleteVehicle);

export default router;