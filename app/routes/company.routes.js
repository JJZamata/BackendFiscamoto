import express from "express";
import { 
  listCompanies, 
  getCompanyDetails, 
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

// Rutas públicas (si es necesario)

// Rutas protegidas - Listado principal con paginación
router.get("/", [verifyToken, isAdminOrFiscalizador], listCompanies);

// Rutas de administrador
router.get("/admin/stats", [verifyToken, isAdmin, criticalLimiter], getCompanyStats);

// Rutas compartidas (admin y fiscalizador)
router.get("/search", [verifyToken, isAdminOrFiscalizador], searchCompanies);
router.get("/filter", [verifyToken, isAdminOrFiscalizador], filterCompaniesByStatus);
router.get("/:ruc", [verifyToken, isAdminOrFiscalizador], getCompanyDetails);

export default router;