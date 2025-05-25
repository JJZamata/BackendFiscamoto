import { validationResult } from "express-validator";
import db from "../models/index.js";

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

export const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    const user = await db.user.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { username: req.body.username },
          { email: req.body.email }
        ]
      }
    });

    if (user) {
      const field = user.username === req.body.username ? 'username' : 'email';
      return res.status(400).json({
        success: false,
        message: `El ${field} ya está en uso`,
        field
      });
    }

    next();
  } catch (error) {
    console.error("Error en checkDuplicateUsernameOrEmail:", error);
    res.status(500).json({
      success: false,
      message: "Error al verificar credenciales"
    });
  }
};

export const checkDuplicateDeviceInfo = async (req, res, next) => {
  try {
    // IMPORTANTE: En signup NO validamos deviceInfo porque no debe existir
    if (req.method === 'POST' && req.path.includes('/signup')) {
      // Para signup, simplemente continúa sin validar deviceInfo
      return next();
    }

    // Solo validar deviceInfo si está presente (para login o actualización)
    if (req.body.deviceInfo?.deviceId) {
      const existingUser = await db.user.findOne({ 
        where: db.sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(deviceInfo, '$.deviceId')) = '${req.body.deviceInfo.deviceId}'`),
        // Opcional: excluir al propio usuario si es actualización
        ...(req.params.id ? { id: { [db.Sequelize.Op.ne]: req.params.id } } : {})
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "El deviceId ya está registrado para otro fiscalizador",
          field: "deviceInfo",
          existingUser: {
            username: existingUser.username,
            email: existingUser.email
          }
        });
      }
    }
    
    next();
  } catch (error) {
    console.error("Error en checkDuplicateDeviceInfo:", error);
    return res.status(500).json({
      success: false,
      message: "Error al verificar deviceInfo"
    });
  }
};

export const checkRolesExisted = async (req, res, next) => {
  if (!req.body.roles || req.body.roles.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Debe proporcionar al menos un rol"
    });
  }

  try {
    const roles = await db.role.findAll();
    const validRoles = roles.map(role => role.name);
    
    const invalidRoles = req.body.roles.filter(role => 
      !validRoles.includes(role)
    );

    if (invalidRoles.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Roles no válidos: ${invalidRoles.join(', ')}`,
        validRoles
      });
    }

    next();
  } catch (error) {
    console.error("Error en checkRolesExisted:", error);
    res.status(500).json({
      success: false,
      message: "Error al verificar roles"
    });
  }
};
