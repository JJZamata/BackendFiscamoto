import express from "express";

import {
  allAccess,
  userProfile,
  adminDashboard,
  fiscalizadorDashboard,
  updateProfile,
  deactivateUser,
  activateUser,
  listUsers
} from "../controllers/user.controller.js";

import {
  verifyToken,
  isAdmin,
  isFiscalizador,
  isAdminOrFiscalizador
} from "../middlewares/authJwt.js";

import { criticalLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// Rutas públicas
router.get("/public", allAccess);

// Rutas protegidas
router.get("/profile", [verifyToken], userProfile);
router.put("/profile", [verifyToken], updateProfile);

// Rutas de administrador
router.get("/admin/dashboard", [verifyToken, isAdmin], adminDashboard);
router.get("/admin/users", [verifyToken, isAdmin, criticalLimiter], listUsers);
router.put("/admin/users/:id/deactivate", [verifyToken, isAdmin], deactivateUser);
router.put("/admin/users/:id/activate", [verifyToken, isAdmin], activateUser);

// Rutas de fiscalizador
router.get("/fiscalizador/dashboard", [verifyToken, isFiscalizador], fiscalizadorDashboard);

// Rutas compartidas
router.get("/shared", [verifyToken, isAdminOrFiscalizador], (req, res) => {
  res.json({
    success: true,
    message: "Contenido compartido entre administradores y fiscalizadores",
    user: {
      id: req.user.id,
      username: req.user.username,
      roles: req.user.roles.map(role => role.name)
    }
  });
});

export default router;