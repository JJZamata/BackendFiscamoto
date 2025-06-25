//routes/company.routes.js
import express from "express";
import { 
  listCompanies, 
  getCompanyDetails, 
  createCompany,
  updateCompany,
  deleteCompany,
  bulkDeleteCompanies,
  getCompanyStats, 
  filterCompaniesByStatus,
  searchCompanies 
} from "../controllers/company.controller.js";
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

// Listado principal con paginación
router.get("/", [verifyToken, isAdminOrFiscalizador], listCompanies);

// Búsqueda de empresas
router.get("/search", [verifyToken, isAdminOrFiscalizador], searchCompanies);

// Filtrar por estado RUC
router.get("/filter", [verifyToken, isAdminOrFiscalizador], filterCompaniesByStatus);

// Obtener detalles de una empresa específica (debe ir después de las rutas con parámetros específicos)
router.get("/:ruc", [verifyToken, isAdminOrFiscalizador], getCompanyDetails);

// ============================================
// RUTAS DE ADMINISTRADOR (CRUD COMPLETO)
// ============================================

// Estadísticas de empresas (solo admin)
router.get("/admin/stats", [verifyToken, isAdmin, criticalLimiter], getCompanyStats);

// Crear nueva empresa (solo admin)
router.post("/", [verifyToken, isAdmin, criticalLimiter], createCompany);

// Actualizar empresa (solo admin)
router.put("/:ruc", [verifyToken, isAdmin, criticalLimiter], updateCompany);

// Eliminar empresa individual (solo admin)
router.delete("/:ruc", [verifyToken, isAdmin, criticalLimiter], deleteCompany);

// Eliminación masiva de empresas (solo admin)
router.delete("/bulk/delete", [verifyToken, isAdmin, criticalLimiter], bulkDeleteCompanies);

export default router;