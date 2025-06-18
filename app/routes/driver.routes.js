import express from "express";

import {
  listDrivers,
  getDriverByDni,
  searchDrivers,
  getDriversStats
} from "../controllers/driver.controller.js";

import {
  verifyToken,
  isAdmin,
  isFiscalizador,
  isAdminOrFiscalizador
} from "../middlewares/authJwt.js";

import { criticalLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// Rutas para administradores
router.get("/list", [verifyToken, isAdmin, criticalLimiter], listDrivers);
router.get("/stats", [verifyToken, isAdmin], getDriversStats);
router.get("/search", [verifyToken, isAdmin, criticalLimiter], searchDrivers);

// Rutas compartidas (admin y fiscalizador)
router.get("/:dni", [verifyToken, isAdmin], getDriverByDni);

/*
  Faltaria ver este endpoint si es necesario, ya que la ruta de searchDrivers ya cumple con la función de búsqueda
  y ademas no tiene sentido que un fiscalizador pueda buscar conductores por DNI, ya que no tiene acceso a esa información.
*/
// Ruta específica para fiscalizadores (consulta rápida durante fiscalización)
router.get("/fiscalizador/search", [verifyToken, isAdmin, criticalLimiter], searchDrivers);

export default router;