//routes/violations.routes.js
import express from "express";
import { 
  listViolations, 
  getViolationDetails, 
  getViolationStats, 
  filterViolationsBySeverity,
  filterViolationsByTarget,
  searchViolations 
} from "../controllers/violations.controller.js";
import {
  verifyToken,
  isAdmin,
  isFiscalizador,
  isAdminOrFiscalizador
} from "../middlewares/authJwt.js";
import { criticalLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// Rutas protegidas - Listado principal con paginación
router.get("/", [verifyToken, isAdminOrFiscalizador], listViolations);

// Rutas de administrador
router.get("/admin/stats", [verifyToken, isAdmin, criticalLimiter], getViolationStats);

// Rutas compartidas (admin y fiscalizador)
router.get("/search", [verifyToken, isAdminOrFiscalizador], searchViolations);
router.get("/filter/severity", [verifyToken, isAdminOrFiscalizador], filterViolationsBySeverity);
router.get("/filter/target", [verifyToken, isAdminOrFiscalizador], filterViolationsByTarget);
router.get("/:id", [verifyToken, isAdminOrFiscalizador], getViolationDetails);

export default router;