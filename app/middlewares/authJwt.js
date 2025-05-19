import jwt from "jsonwebtoken";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import { getPlatformFromRequest } from "../utils/platformDetector.js";

const { user: User, role: Role } = db;

export const verifyToken = async (req, res, next) => {
  let token = null;
  let platform = 'web';

  // Intentar obtener el token de la cookie primero (para web)
  if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  } 
  // Si no hay cookie, intentar obtener el token del header Authorization (para móvil)
  else {
    const authHeader = (req.headers["authorization"] || '').trim();
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      platform = getPlatformFromRequest(req);
    }
  }

  if (!token) {
    return res.status(403).json({ 
      success: false,
      message: "Se requiere autenticación" 
    });
  }

  if (token.length < 100 || token.length > 2000) {
    return res.status(403).json({
      success: false,
      message: "Token malformado"
    });
  }

  try {
    const decoded = jwt.verify(token, authConfig.secret);
    
    // Verificar que la plataforma coincida
    const requestPlatform = getPlatformFromRequest(req);
        if (decoded.platform !== requestPlatform) {
            return res.status(403).json({
                success: false,
                message: "Token no válido para esta plataforma"
            });
        }

    req.userId = decoded.id;
    req.platform = platform;
    
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

    // Verificar deviceInfo para fiscalizadores
    if (user.isFiscalizador()) {
      const deviceInfo = req.headers["x-device-info"];
      if (!deviceInfo) {
        return res.status(403).json({ 
          success: false,
          message: "Se requiere el deviceInfo del dispositivo para fiscalizadores" 
        });
      }

      try {
        const parsedDeviceInfo = JSON.parse(deviceInfo);
        const userDeviceInfo = typeof user.deviceInfo === 'string' 
          ? JSON.parse(user.deviceInfo) 
          : user.deviceInfo;
        
        if (!parsedDeviceInfo.deviceId || parsedDeviceInfo.deviceId !== userDeviceInfo?.deviceId) {
          return res.status(403).json({ 
            success: false,
            message: "DeviceId no válido para este fiscalizador" 
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Formato de deviceInfo inválido"
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