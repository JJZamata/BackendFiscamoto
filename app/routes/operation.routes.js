// File: app/routes/operation.routes.js
import express from "express";

import {
  getDriverInfo,
  getVehicleInfo,
  getOperationInfo
} from "../controllers/operation.controller.js";

import {
  verifyToken,
  isAdminOrFiscalizador
} from "../middlewares/authJwt.js";

import { generalLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// Rutas para consultas de operación (requiere autenticación y rol de admin o fiscalizador)

// Obtener información del conductor por DNI
router.get("/driver/:id", [
  verifyToken, 
  isAdminOrFiscalizador, 
  /*generalLimiter*/
], getDriverInfo);

// Obtener información del vehículo por placa
router.get("/vehicle/:id", [
  verifyToken, 
  isAdminOrFiscalizador, 
  /*generalLimiter*/
], getVehicleInfo);

// Endpoint combinado para obtener información completa
router.post("/search", [
  verifyToken, 
  isAdminOrFiscalizador, 
  /*generalLimiter*/
], getOperationInfo);

export default router;