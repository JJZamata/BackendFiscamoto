//routes/owner.routes.js
import express from "express";
import { 
  getOwnerByDni,
  createOwner,
  updateOwner,
  deleteOwner,
  bulkDeleteOwners
} from "../controllers/owner.controller.js";
import {
  verifyToken,
  isAdmin,
  isFiscalizador,
  isAdminOrFiscalizador
} from "../middlewares/authJwt.js";
import { criticalLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// ============================================
// RUTAS DE LECTURA (GET) - Admin y Fiscalizador
// ============================================

// Obtener propietario por DNI
router.get("/:dni", [verifyToken, isAdminOrFiscalizador], getOwnerByDni);

// ============================================
// RUTAS DE ADMINISTRADOR (CRUD COMPLETO)
// ============================================

// Crear nuevo propietario (solo admin)
router.post("/", [verifyToken, isAdmin, criticalLimiter], createOwner);

// Actualizar propietario (solo admin)
router.put("/:dni", [verifyToken, isAdmin, criticalLimiter], updateOwner);

// Eliminar propietario individual (solo admin)
router.delete("/:dni", [verifyToken, isAdmin, criticalLimiter], deleteOwner);

// Eliminación masiva de propietarios (solo admin)
router.delete("/bulk/delete", [verifyToken, isAdmin, criticalLimiter], bulkDeleteOwners);

export default router;