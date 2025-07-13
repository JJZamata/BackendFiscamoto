// File: app/routes/driver.routes.js
import express from "express";

import {
  listDrivers,
  getDriverByDni,
  searchDrivers,
  getDriversStats,
  createDriver,
  updateDriver,
  deleteDriver
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
router.post("/", [verifyToken, isAdmin, criticalLimiter], createDriver);
router.put("/:dni", [verifyToken, isAdmin, criticalLimiter], updateDriver);
router.delete("/:dni", [verifyToken, isAdmin, criticalLimiter], deleteDriver);

router.get("/list", [verifyToken, isAdmin, criticalLimiter], listDrivers);
router.get("/stats", [verifyToken, isAdmin], getDriversStats);
router.get("/search", [verifyToken, isAdmin, criticalLimiter], searchDrivers);
router.get("/:dni", /*[verifyToken, isAdmin], */getDriverByDni);

/*
  Faltaria ver este endpoint si es necesario, ya que la ruta de searchDrivers ya cumple con la función de búsqueda
  y ademas no tiene sentido que un fiscalizador pueda buscar conductores por DNI, ya que no tiene acceso a esa información.
  No eliminar
*/
// Ruta específica para fiscalizadores (consulta rápida durante fiscalización)
router.get("/fiscalizador/search", [verifyToken, isFiscalizador, criticalLimiter], searchDrivers);

export default router;