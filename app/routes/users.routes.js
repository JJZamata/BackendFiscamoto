// File: app/routes/users.routes.js
import express from "express";

import {
  getUsersOverview,
  getUserById,
  getUsersByRole
} from "../controllers/users.controller.js";

import {
  verifyToken,
  isAdmin
} from "../middlewares/authJwt.js";

import { generalLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// Rutas para gestión de usuarios (requiere autenticación y rol de administrador)

// Obtener overview completo: estadísticas + listado paginado de usuarios
router.get("/", [
  verifyToken, 
  isAdmin, 
  generalLimiter
], getUsersOverview);

// Obtener información detallada de un usuario específico por ID
router.get("/:id", [
  verifyToken, 
  isAdmin, 
  generalLimiter
], getUserById);

// Obtener usuarios filtrados por rol (admin | fiscalizador)
router.get("/role/:role", [
  verifyToken, 
  isAdmin, 
  generalLimiter
], getUsersByRole);

export default router;