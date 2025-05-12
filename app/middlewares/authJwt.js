import jwt from "jsonwebtoken";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
const { user: User, role: Role } = db;

export const verifyToken = async (req, res, next) => {
  const token = req.headers["x-access-token"] || req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ 
      success: false,
      message: "No se proporcionó un token de autenticación" 
    });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), authConfig.secret);
    req.userId = decoded.id;
    
    const user = await User.findByPk(req.userId, {
      include: [{
        model: Role,
        as: 'roles'
      }]
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Usuario no encontrado" 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: "Usuario inactivo" 
      });
    }

    // Verificar IMEI para fiscalizadores
    if (user.isFiscalizador()) {
      const imei = req.headers["x-device-imei"];
      if (!imei) {
        return res.status(403).json({ 
          success: false,
          message: "Se requiere el IMEI del dispositivo para fiscalizadores" 
        });
      }
      if (imei !== user.imei) {
        return res.status(403).json({ 
          success: false,
          message: "IMEI no válido para este fiscalizador" 
        });
      }
    }

    // Actualizar último acceso
    await user.update({
      lastLogin: new Date(),
      lastLoginIp: req.ip,
      lastLoginDevice: req.headers["user-agent"]
    });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expirado" 
      });
    }
    return res.status(401).json({ 
      success: false,
      message: "Token no válido" 
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user.isAdmin()) {
      return res.status(403).json({ 
        success: false,
        message: "Se requiere el rol de administrador" 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error al verificar rol de administrador" 
    });
  }
};

export const isFiscalizador = async (req, res, next) => {
  try {
    if (!req.user.isFiscalizador()) {
      return res.status(403).json({ 
        success: false,
        message: "Se requiere el rol de fiscalizador" 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error al verificar rol de fiscalizador" 
    });
  }
};

export const isAdminOrFiscalizador = async (req, res, next) => {
  try {
    if (!req.user.isAdmin() && !req.user.isFiscalizador()) {
      return res.status(403).json({ 
        success: false,
        message: "Se requiere el rol de administrador o fiscalizador" 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error al verificar roles" 
    });
  }
};