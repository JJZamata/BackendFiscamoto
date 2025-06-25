// File: app/routes/driving_license.routes.js
import express from "express";

import {
  createDrivingLicense,
} from "../controllers/driving_license.controller.js";

import {
  verifyToken,
  isAdmin,
  isFiscalizador,
  isAdminOrFiscalizador
} from "../middlewares/authJwt.js";

import { criticalLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// Rutas para administradores
router.post("/", [verifyToken, isAdmin, criticalLimiter], createDrivingLicense);

export default router;