// File: app/routes/documents.routes.js
import express from "express";

import {
  getDocuments,
  getDocumentsByType,
  createTechnicalReview,
  createInsurance,
  updateTechnicalReview,
  updateInsurance,
  deleteTechnicalReview,
  deleteInsurance
} from "../controllers/document.controller.js";

import {
  verifyToken,
  isAdminOrFiscalizador,
  isAdmin
} from "../middlewares/authJwt.js";

import { generalLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// ================== RUTAS DE CONSULTA ==================
// Requieren autenticación y rol de admin o fiscalizador

// Obtener listado general de todos los documentos (revisiones técnicas + seguros AFOCAT)
// Con paginación de 6 elementos por página
router.get("/",/* [
  verifyToken, 
  isAdminOrFiscalizador, 
  generalLimiter
],*/ getDocuments);

// Obtener documentos filtrados por tipo
// Parámetros: type = 'revision' | 'afocat'
router.get("/type/:type", [
  verifyToken, 
  isAdminOrFiscalizador, 
  generalLimiter
], getDocumentsByType);

// ================== RUTAS DE CREACIÓN ==================
// Requieren autenticación y rol de admin para operaciones de escritura

// Crear nueva revisión técnica
// Body: { vehicle_plate, issue_date, expiration_date, inspection_result, certifying_company }
router.post("/technical-review", [
  verifyToken,
  isAdmin,
  generalLimiter
], createTechnicalReview);

// Crear nuevo seguro AFOCAT
// Body: { insurance_company_name, policy_number, vehicle_plate, start_date, expiration_date, coverage, license_id?, owner_dni }
router.post("/insurance", [
  verifyToken,
  isAdmin,
  generalLimiter
], createInsurance);

// ================== RUTAS DE ACTUALIZACIÓN ==================
// Requieren autenticación y rol de admin para operaciones de escritura

// Actualizar revisión técnica por ID
// Body: Campos opcionales para actualizar
router.put("/technical-review/:id", [
  verifyToken,
  isAdmin,
  generalLimiter
], updateTechnicalReview);

// Actualizar seguro AFOCAT por ID
// Body: Campos opcionales para actualizar
router.put("/insurance/:id", [
  verifyToken,
  isAdmin,
  generalLimiter
], updateInsurance);

// ================== RUTAS DE ELIMINACIÓN ==================
// Requieren autenticación y rol de admin para operaciones de escritura

// Eliminar revisión técnica por ID
router.delete("/technical-review/:id", [
  verifyToken,
  isAdmin,
  generalLimiter
], deleteTechnicalReview);

// Eliminar seguro AFOCAT por ID
router.delete("/insurance/:id", [
  verifyToken,
  isAdmin,
  generalLimiter
], deleteInsurance);

export default router;