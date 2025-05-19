import db from "../models/index.js";
import jwt from "jsonwebtoken";
import authConfig from "../config/auth.config.js";
import { getPlatformFromRequest } from "../utils/platformDetector.js";

const { user: User, role: Role } = db;

// Mapeo de errores a respuestas HTTP
const ERROR_MAPPING = {
    'FISCALIZADOR_REQUIRES_DEVICE': {
        status: 400,
        message: "Los fiscalizadores deben proporcionar un deviceInfo con deviceId",
        field: "deviceInfo"
    },
    'ADMIN_CANNOT_HAVE_DEVICE': {
        status: 400,
        message: "Los administradores no deben tener deviceInfo",
        field: "deviceInfo"
    },
    'DEVICE_ID_REQUIRED': {
        status: 400,
        message: "Se requiere un deviceId válido",
        field: "deviceInfo.deviceId"
    },
    'INVALID_PLATFORM': {
        status: 400,
        message: "Plataforma no válida (debe ser android o ios)",
        field: "deviceInfo.platform"
    },
    'SequelizeUniqueConstraintError': {
        status: 400,
        message: (error) => `Error de duplicidad: El ${error.errors[0]?.path || 'campo'} ya está en uso`,
        field: (error) => error.errors[0]?.path || 'campo'
    }
};

export const signup = async (req, res) => {
  try {
      const { username, email, password, roles } = req.body;

      // Creación del usuario - Las validaciones se manejan en el modelo
      const user = await User.create({
          username,
          email,
          password, // El hashing se maneja en el setter del modelo
          deviceInfo: req.body.deviceInfo,
          roles // Sequelize manejará la asociación
      });

      // Asignación de roles
      if (roles && roles.length) {
          const roleInstances = await Role.findAll({
              where: { name: roles }
          });
          await user.setRoles(roleInstances);
      }

      res.status(201).json({
          success: true,
          message: "Usuario registrado exitosamente",
          data: {
              id: user.id,
              username: user.username,
              roles: roles || []
          }
      });

  } catch (error) {
      console.error("Error en signup:", error);
      
      // Manejo de errores conocido
      if (ERROR_MAPPING[error.message]) {
          const { status, message, field } = ERROR_MAPPING[error.message];
          return res.status(status).json({
              success: false,
              message,
              field
          });
      }

      // Manejo de errores de Sequelize
      if (error.name in ERROR_MAPPING) {
          const { status, message, field } = ERROR_MAPPING[error.name];
          return res.status(status).json({
              success: false,
              message: typeof message === 'function' ? message(error) : message,
              field: typeof field === 'function' ? field(error) : field
          });
      }

      // Error genérico
      res.status(500).json({
          success: false,
          message: "Error al registrar usuario",
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};

export const signin = async (req, res) => {
  try {
      const { username, password, deviceInfo } = req.body;
      
      // Determinar plataforma de manera consistente
      let platform = getPlatformFromRequest(req);
      
      // Si es móvil, validar deviceInfo
      const isMobile = ['android', 'ios'].includes(platform);
      if (isMobile) {
          if (!deviceInfo || !deviceInfo.deviceId) {  // Corregido el typo de deviceId
              return res.status(400).json({
                  success: false,
                  message: "Se requiere deviceInfo para plataformas móviles"
              });
          }
          // Forzar plataforma desde deviceInfo si es móvil
          if (deviceInfo.platform && ['android', 'ios'].includes(deviceInfo.platform)) {
              platform = deviceInfo.platform;
          }
      }

      const user = await User.findOne({
          where: { username },
          include: { model: Role, as: "roles" }
      });

      if (!user) {
          return res.status(404).json({
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

      // Verificar contraseña
      const passwordIsValid = user.verifyPassword(password);
      if (!passwordIsValid) {
          return res.status(401).json({
              success: false,
              message: "Contraseña inválida"
          });
      }

      // Verificación de deviceInfo para fiscalizadores
      if (user.isFiscalizador()) {
          console.log('User deviceInfo:', user.deviceInfo);
          
          // Parsear deviceInfo si es string
          const userDeviceInfo = typeof user.deviceInfo === 'string' 
              ? JSON.parse(user.deviceInfo) 
              : user.deviceInfo || {};
          
          if (!isMobile) {
              return res.status(403).json({
                  success: false,
                  message: "Los fiscalizadores solo pueden acceder desde aplicaciones móviles"
              });
          }

          if (!deviceInfo || !deviceInfo.deviceId) {
              return res.status(400).json({
                  success: false,
                  message: "Se requiere información del dispositivo para fiscalizadores",
                  requiredFields: {
                      deviceInfo: {
                          deviceId: "string",
                          platform: "'android' o 'ios'"
                      }
                  }
              });
          }

          console.log('Request deviceId:', deviceInfo.deviceId);
          console.log('Stored deviceId:', userDeviceInfo.deviceId);

          if (deviceInfo.deviceId !== userDeviceInfo.deviceId) {
              return res.status(403).json({
                  success: false,
                  message: "Dispositivo no autorizado para este usuario"
              });
          }
      }

      // Configuración del token
      const roleConfig = authConfig.roles[user.roles[0].name];
      const tokenExpiration = roleConfig ? roleConfig.tokenExpiration : authConfig.jwtExpiration;

      const token = jwt.sign(
          { 
              id: user.id,
              roles: user.roles.map(role => role.name),
              platform
          },
          authConfig.secret,
          { expiresIn: tokenExpiration }
      );

      // Actualizar último acceso
      await user.update({
          lastLogin: new Date(),
          lastLoginIp: req.ip,
          lastLoginDevice: req.headers["user-agent"]
      });

      // Preparar respuesta
      const responseData = {
          id: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles.map(role => role.name),
          requiresDeviceInfo: user.isFiscalizador(),
          platform
      };

      // Respuesta diferente para móvil vs web
      if (isMobile) {  // Usamos la variable isMobile ya definida
          return res.status(200).json({
              success: true,
              data: {
                  ...responseData,
                  accessToken: token,
                  expiresIn: tokenExpiration
              }
          });
      } else {
          res.cookie('auth_token', token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: tokenExpiration * 1000,
              path: '/'
          });

          return res.status(200).json({
              success: true,
              data: responseData
          });
      }
  } catch (error) {
      console.error("Error en signin:", error);
      res.status(500).json({
          success: false,
          message: "Error al iniciar sesión",
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};

// signout se mantiene exactamente igual
export const signout = async (req, res) => {
  try {
      const platform = req.user?.platform || getPlatformFromRequest(req);
      const isMobilePlatform = platform === 'android' || platform === 'ios';
      
      if (isMobilePlatform) {
          return res.status(200).json({
              success: true,
              message: "Sesión cerrada exitosamente"
          });
      } else {
          res.clearCookie('auth_token', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              path: '/'
          });
          
          return res.status(200).json({
              success: true,
              message: "Sesión cerrada exitosamente"
          });
      }
  } catch (error) {
      console.error("Error en signout:", error);
      res.status(500).json({
          success: false,
          message: "Error al cerrar sesión"
      });
  }
};