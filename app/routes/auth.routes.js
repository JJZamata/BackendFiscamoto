import express from "express";
import { body } from "express-validator";
import { signup, signin } from "../controllers/auth.controller.js";
import {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
  validateRequest
} from "../middlewares/verifySignUp.js";

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
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos una letra mayúscula, una minúscula, un número y un carácter especial'),
  
  body('roles')
    .isArray()
    .withMessage('Los roles deben ser proporcionados como un array')
    .custom((roles) => {
      const validRoles = ['admin', 'fiscalizador'];
      return roles.every(role => validRoles.includes(role));
    })
    .withMessage('Los roles válidos son: admin, fiscalizador'),
  
  body('imei')
    .optional()
    .isLength({ min: 15, max: 15 })
    .withMessage('El IMEI debe tener 15 dígitos')
    .isNumeric()
    .withMessage('El IMEI debe contener solo números'),
  
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
  
  body('imei')
    .optional()
    .isLength({ min: 15, max: 15 })
    .withMessage('El IMEI debe tener 15 dígitos')
    .isNumeric()
    .withMessage('El IMEI debe contener solo números'),
  
  validateRequest
];

// Rutas de autenticación
router.post("/signup", 
  signupValidation,
  [checkDuplicateUsernameOrEmail, checkRolesExisted], 
  signup
);

router.post("/signin", 
  signinValidation,
  signin
);

export default router;