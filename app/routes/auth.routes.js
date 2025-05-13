import express from "express";
import { body } from "express-validator";
import { signup, signin, signout } from "../controllers/auth.controller.js";
import {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
  checkDuplicateImei,
  validateRequest
} from "../middlewares/verifySignUp.js";
import { verifyToken } from "../middlewares/authJwt.js";

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
    .if(body('roles').custom(roles => roles.includes('fiscalizador')))
    .notEmpty().withMessage('IMEI es requerido para fiscalizadores')
    .isLength({ min: 15, max: 15 }).withMessage('IMEI debe tener 15 dígitos')
    .isNumeric().withMessage('IMEI debe ser numérico'),
  
  body('imei')
    .if(body('roles').custom(roles => !roles.includes('fiscalizador')))
    .isEmpty().withMessage('IMEI no debe ser proporcionado para este rol'),
  
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
  
  body('clientType')
    .isIn(['web', 'mobile'])
    .withMessage('El tipo de cliente debe ser "web" o "mobile"'),
  
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
  [checkDuplicateUsernameOrEmail, checkRolesExisted,checkDuplicateImei], 
  signup
);

//inicio de sesión
router.post("/signin", 
  signinValidation,
  signin
);

router.post("/signout",
  verifyToken,
  signout
);

export default router;