// File: app/routes/documents.routes.js
import express from "express";

import {
  getDocuments,
  getDocumentsByType
} from "../controllers/document.controller.js";

import {
  verifyToken,
  isAdminOrFiscalizador
} from "../middlewares/authJwt.js";

import { generalLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// Rutas para visualización de documentos (requiere autenticación y rol de admin o fiscalizador)

// Obtener listado general de todos los documentos (revisiones técnicas + seguros AFOCAT)
// Con paginación de 6 elementos por página
router.get("/", [
  verifyToken, 
  isAdminOrFiscalizador, 
  /*generalLimiter*/
], getDocuments);

// Obtener documentos filtrados por tipo
// Parámetros: type = 'revision' | 'afocat'
router.get("/type/:type", [
  verifyToken, 
  isAdminOrFiscalizador, 
  /*generalLimiter*/
], getDocumentsByType);

export default router;