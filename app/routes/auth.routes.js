import express from "express";
import { body } from "express-validator";
import { signup, signin, signout } from "../controllers/auth.controller.js";
import {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
  checkDuplicateDeviceInfo,
  validateRequest
} from "../middlewares/verifySignUp.js";
import { verifyToken,isAdmin } from "../middlewares/authJwt.js";
import { loginLimiter } from "../config/rateLimiter.config.js";

const router = express.Router();

// Validaciones para el registro
const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('El nombre de usuario debe tener entre 3 y 20 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  
  body('password')
  .isLength({ min: 8 })
  .withMessage('La contraseña debe tener al menos 8 caracteres')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/)
  .withMessage('La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial'),
  
  body('roles')
    .isArray()
    .withMessage('Los roles deben ser proporcionados como un array')
    .custom((roles) => {
      const validRoles = ['admin', 'fiscalizador'];
      return roles.every(role => validRoles.includes(role));
    })
    .withMessage('Los roles válidos son: admin, fiscalizador'),

  body('deviceInfo')
    .if(body('roles').custom(roles => !roles.includes('fiscalizador')))
    .isEmpty().withMessage('deviceInfo no debe ser proporcionado para este rol'),
  
  validateRequest
];

// Validaciones para el inicio de sesión
const signinValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario es requerido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  
  body('platform')
    .optional()
    .isIn(['android', 'ios', 'web'])
    .withMessage('La plataforma debe ser "android", "ios" o "web"'),
  
  body('deviceInfo')
    .optional()
    .custom((value) => {
      if (value && (!value.deviceId || typeof value.deviceId !== 'string')) {
        throw new Error('deviceInfo debe contener un deviceId válido');
      }
      return true;
    }),
  
  validateRequest
];

router.post("/signup", 
  signupValidation,
  //verifyToken,  // ← PRIMERO verificar token
  //isAdmin,      // ← DESPUÉS verificar si es admin
  [checkDuplicateUsernameOrEmail, checkRolesExisted, checkDuplicateDeviceInfo],
  signup
);

//inicio de sesión
router.post("/signin", 
  loginLimiter,
  signinValidation,
  signin
);

router.post("/signout",
  verifyToken,
  signout
);

export default router;