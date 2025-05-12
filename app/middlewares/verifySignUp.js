import { validationResult } from "express-validator";
import db from "../models/index.js";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";

const { ROLES, user: UserModel } = db;

// Middleware para validar los resultados de express-validator
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Verificar si el username o email ya existe
export const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // Verificar username
    const userByUsername = await UserModel.findOne({
      where: {
        username: req.body.username
      }
    });

    if (userByUsername) {
      return res.status(400).json({
        success: false,
        message: "Error: El nombre de usuario ya está en uso"
      });
    }

    // Verificar email
    const userByEmail = await UserModel.findOne({
      where: {
        email: req.body.email
      }
    });

    if (userByEmail) {
      return res.status(400).json({
        success: false,
        message: "Error: El email ya está en uso"
      });
    }

    next();
  } catch (error) {
    console.error("Error en checkDuplicateUsernameOrEmail:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al verificar credenciales"
    });
  }
};

// Verificar si los roles existen
export const checkRolesExisted = async (req, res, next) => {
  if (req.body.roles) {
    try {
      const roles = await Role.findAll({
        where: {
          name: req.body.roles
        }
      });

      const validRoles = ['admin', 'fiscalizador'];
      const invalidRoles = req.body.roles.filter(role => !validRoles.includes(role));

      if (invalidRoles.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Error: Los siguientes roles no son válidos: ${invalidRoles.join(', ')}`
        });
      }

      if (roles.length !== req.body.roles.length) {
        return res.status(400).json({
          success: false,
          message: "Error: Uno o más roles no existen en la base de datos"
        });
      }
    } catch (error) {
      console.error("Error en checkRolesExisted:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al verificar roles"
      });
    }
  }
  next();
};