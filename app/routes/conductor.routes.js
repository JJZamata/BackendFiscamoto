import express from "express";
import { getAllConductores } from "../controllers/conductor.controller.js";

import {
  verifyToken,
  isAdmin,
  isFiscalizador,
  isAdminOrFiscalizador
} from "../middlewares/authJwt.js";

import { criticalLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// Rutas protegidas para administradores
router.get("/admin/all", [
  verifyToken, 
  isAdmin, 
  criticalLimiter
], getAllConductores);

// Rutas protegidas para fiscalizadores
router.get("/fiscalizador/list", [
  verifyToken, 
  isFiscalizador
], getAllConductores);

// Rutas compartidas entre admin y fiscalizador
router.get("/shared/active", [
  verifyToken, 
  isAdminOrFiscalizador
], getAllConductores);

export default router; 