//middlewares/authJwt.js
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";

const { user: User, role: Role } = db;

export const verifyToken = async (req, res, next) => {
  let token = null;

  // Intentar obtener el token de la cookie primero (para web)
  if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  } 
  // Si no hay cookie, intentar obtener el token del header Authorization (para móvil)
  else {
    const authHeader = (req.headers["authorization"] || '').trim();
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
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
    console.log("Token decodificado:", decoded); 
    if (decoded.platform) {
      req.platform = decoded.platform;
    } else {
      return res.status(403).json({
        success: false,
        message: "No se pudo determinar una plataforma válida"
      });
    }

    req.userId = decoded.id;
    // Verificar si el usuario existe y está activo
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
      // Si el token incluye deviceId, lo usamos para la verificación
      if (decoded.deviceId) {
        const userDeviceInfo = typeof user.deviceInfo === 'string' 
          ? JSON.parse(user.deviceInfo) 
          : user.deviceInfo;
        
        if (decoded.deviceId !== userDeviceInfo?.deviceId) {
          return res.status(403).json({ 
            success: false,
            message: "DeviceId no válido para este fiscalizador" 
          });
        }
      } else {
        return res.status(403).json({ 
          success: false,
          message: "No se ha aceptado los permisos necesarios para la aplicación" 
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
    // Verifica primero si existe el usuario en el request
    if (!req.user) {
      return res.status(403).json({ 
        success: false,
        message: "Usuario no autenticado",
        code: "USER_NOT_AUTHENTICATED"
      });
    }

    // Carga los roles si no están cargados
    if (!req.user.roles || !req.user.roles.length) {
      const userWithRoles = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          as: 'roles'
        }]
      });
      
      if (!userWithRoles) {
        return res.status(403).json({ 
          success: false,
          message: "Usuario no encontrado",
          code: "USER_NOT_FOUND"
        });
      }
      
      req.user = userWithRoles;
    }

    // Verificación segura de roles
    const isAdminUser = req.user.roles?.some?.(role => role.name === 'admin');
    
    if (!isAdminUser) {
      return res.status(403).json({ 
        success: false,
        message: "Se requiere rol de administrador",
        code: "ADMIN_ROLE_REQUIRED"
      });
    }

    next();
  } catch (error) {
    console.error("Error en isAdmin middleware:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al verificar permisos",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: "ADMIN_CHECK_ERROR"
    });
  }
};

export const isFiscalizador = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({ 
        success: false,
        message: "Usuario no autenticado",
        code: "USER_NOT_AUTHENTICATED"
      });
    }

    if (!req.user.isFiscalizador()) {
      return res.status(403).json({ 
        success: false,
        message: "Se requiere el rol de fiscalizador" 
      });
    }
    next();
  } catch (error) {
    console.error("Error en isFiscalizador middleware:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al verificar rol de fiscalizador" 
    });
  }
};

export const isAdminOrFiscalizador = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({ 
        success: false,
        message: "Usuario no autenticado",
        code: "USER_NOT_AUTHENTICATED"
      });
    }

    if (!req.user.isAdmin() && !req.user.isFiscalizador()) {
      return res.status(403).json({ 
        success: false,
        message: "Se requiere el rol de administrador o fiscalizador" 
      });
    }
    next();
  } catch (error) {
    console.error("Error en isAdminOrFiscalizador middleware:", error);
    res.status(500).json({ 
      success: false,
      message: "Error al verificar roles" 
    });
  }
};