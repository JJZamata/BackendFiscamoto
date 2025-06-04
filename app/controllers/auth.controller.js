import db from "../models/index.js";
import jwt from "jsonwebtoken";
import authConfig from "../config/auth.config.js";
import { getPlatformFromRequest, getDeviceIdFromRequest } from "../utils/platformDetector.js";

const { user: User, role: Role } = db;
// Mapeo de errores a respuestas HTTP consistentes
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

/**
 * Registro de usuarios (signup)
 * FLUJO DE NEGOCIO:
 * - Solo los ADMINISTRADORES pueden crear usuarios desde el panel web
 * - Los fiscalizadores NO se registran por sí mismos
 * - Los fiscalizadores reciben sus credenciales del administrador
 * - NO requiere deviceInfo en el registro (se configura en el primer login)
 */
export const signup = async (req, res) => {
  try {
      const { username, email, password, roles } = req.body;
      
      // VALIDACIÓN 1: Solo acceso desde web (administradores)
      const platform = getPlatformFromRequest(req);
      const isMobile = ['android', 'ios'].includes(platform);
      
      if (isMobile) {
          return res.status(403).json({
              success: false,
              message: "El registro de usuarios solo está disponible desde el panel web"
          });
      }

      // VALIDACIÓN 2: Verificar que quien registra es administrador
      // Nota: Uso de middlware isAdmin esta en la ruta

      // VALIDACIÓN 3: Prevenir deviceInfo en registro
      // El deviceInfo se configurará automáticamente en el primer login del fiscalizador
      if (req.body.deviceInfo) {
          return res.status(400).json({
              success: false,
              message: "No se debe incluir deviceInfo en el registro. Se configurará automáticamente en el primer acceso.",
              field: "deviceInfo"
          });
      }

      // Creación del usuario sin deviceInfo
      const user = await User.create({
          username,
          email,
          password, // El hashing se maneja en el setter del modelo
          deviceInfo: null, // Se configurará en el primer login si es fiscalizador
          isActive: true // Los usuarios creados por admin están activos por defecto
      });

      // Asignación de roles
      if (roles && roles.length) {
          const roleInstances = await Role.findAll({
              where: { name: roles }
          });
          await user.setRoles(roleInstances);
      } else {
          // Por defecto, asignar rol de fiscalizador si no se especifica
          const defaultRole = await Role.findOne({ where: { name: 'fiscalizador' } });
          if (defaultRole) {
              await user.setRoles([defaultRole]);
          }
      }

      // Obtener roles finales para la respuesta
      const userWithRoles = await User.findByPk(user.id, {
          include: { model: Role, as: "roles" }
      });

      res.status(201).json({
          success: true,
          message: "Usuario registrado exitosamente",
          data: {
              id: user.id,
              username: user.username,
              email: user.email,
              roles: userWithRoles.roles.map(role => role.name),
              requiresDeviceSetup: userWithRoles.roles.some(role => role.name === 'fiscalizador'),
              instructions: userWithRoles.roles.some(role => role.name === 'fiscalizador') 
                  ? "El fiscalizador debe configurar su dispositivo en el primer acceso desde la app móvil"
                  : null
          }
      });

  } catch (error) {
      console.error("Error en signup:", error);
      
      // Manejo de errores conocidos
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

/**
 * Inicio de sesión (signin)
 * REGLAS DE NEGOCIO:
 * - Fiscalizadores: SOLO pueden acceder desde apps móviles (Android/iOS)
 * - Administradores: SOLO pueden acceder desde web
 * - Cada fiscalizador está vinculado a un deviceId específico
 */
export const signin = async (req, res) => {
  try {
    const { username, password } = req.body; // Solo username y password
    
    // Obtener información de plataforma y dispositivo desde headers
    const platform = getPlatformFromRequest(req);
    const deviceId = getDeviceIdFromRequest(req);
    
    const isMobile = ['android', 'ios'].includes(platform);
    const deviceInfo = {
      deviceId,
      platform,
      deviceName: req.headers['x-device-name'] || `Dispositivo ${platform}`
    };

    // Validación para fiscalizadores
    if (isMobile) {
      if (!deviceId) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el header X-Device-Id para plataformas móviles"
        });
      }
    }

      // PASO 3: Buscar usuario con sus roles
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

      // PASO 4: Verificar contraseña
      const passwordIsValid = user.verifyPassword(password);
      if (!passwordIsValid) {
          return res.status(401).json({
              success: false,
              message: "Contraseña inválida"
          });
      }

      // PASO 5: LÓGICA DE DIFERENCIACIÓN PRINCIPAL
      // Determinar tipo de usuario para aplicar reglas específicas
      const isAdmin = user.roles.some(role => role.name === 'admin');
      const isFiscalizador = user.isFiscalizador(); // Método del modelo User

      console.log(`Usuario: ${username}, Roles: ${user.roles.map(r => r.name)}, Plataforma: ${platform}`);

      // REGLA 1: Administradores solo por WEB
      if (isAdmin && isMobile) {
          return res.status(403).json({
              success: false,
              message: "Los administradores solo pueden acceder desde el portal web"
          });
      }

      // REGLA 2: Fiscalizadores solo por MÓVIL con configuración de dispositivo
      if (isFiscalizador) {
          // Los fiscalizadores DEBEN usar app móvil
          if (!isMobile) {
              return res.status(403).json({
                  success: false,
                  message: "Los fiscalizadores solo pueden acceder desde aplicaciones móviles"
              });
          }

          // Validar deviceInfo obligatorio para fiscalizadores
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

          // MANEJO DE PRIMER LOGIN vs LOGIN SUBSECUENTE usando el nuevo campo
          console.log(`Fiscalizador ${username} - deviceConfigured: ${user.deviceConfigured}`);
          
          if (!user.deviceConfigured) {
              // CASO 1: PRIMER LOGIN - Configurar dispositivo usando método del modelo
              try {
                  console.log(`Primer login del fiscalizador ${username}, configurando dispositivo:`, deviceInfo);
                  
                  await user.configureDevice(deviceInfo);
                  
                  console.log('Dispositivo configurado exitosamente para:', username);
                  
              } catch (deviceError) {
                  console.error('Error configurando dispositivo:', deviceError);
                  return res.status(400).json({
                      success: false,
                      message: "Error al configurar el dispositivo",
                      error: deviceError.message
                  });
              }
              
          } else {
              // CASO 2: LOGIN SUBSECUENTE - Validar dispositivo autorizado usando método del modelo
              if (!user.isAuthorizedDevice(deviceInfo)) {
                  console.log('Dispositivo no autorizado:');
                  console.log('Request deviceId:', deviceInfo.deviceId);
                  console.log('Stored deviceId:', user.deviceInfo?.deviceId);
                  
                  return res.status(403).json({
                      success: false,
                      message: "Dispositivo no autorizado para este usuario",
                      details: "Solo puedes acceder desde el dispositivo registrado inicialmente"
                  });
              }
              
              // Actualizar último uso del dispositivo
              await user.updateDeviceUsage();
          }
      }

      // REGLA 3: Usuarios web que NO son admin están prohibidos
      // Esta validación parece estar duplicada, podría simplificarse
      if (!isMobile && !isAdmin) {
          return res.status(403).json({
              success: false,
              message: "Este portal es exclusivo para administradores"
          });
      }

      // PASO 6: Generar token JWT
      // Configuración de expiración por rol
      const roleConfig = authConfig.roles[user.roles[0].name];
      const tokenExpiration = roleConfig ? roleConfig.tokenExpiration : authConfig.jwtExpiration;

      const token = jwt.sign(
          { 
              id: user.id,
              roles: user.roles.map(role => role.name),
              platform // Incluir plataforma en el token
          },
          authConfig.secret,
          { expiresIn: tokenExpiration }
      );

      // PASO 7: Actualizar estadísticas de acceso
      await user.update({
          lastLogin: new Date(),
          lastLoginIp: req.ip,
          lastLoginDevice: req.headers["user-agent"]
      });

      // PASO 8: Preparar datos de respuesta
      const responseData = {
          id: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles.map(role => role.name),
          requiresDeviceInfo: isFiscalizador,
          platform
      };

      // PASO 9: RESPUESTA DIFERENCIADA POR PLATAFORMA
      if (isMobile) {
          // MÓVIL: Token en el body (para Flutter/React Native)
          // Flutter lo manejará como: final token = response['data']['accessToken']
          return res.status(200).json({
              success: true,
              data: {
                  ...responseData,
                  accessToken: token,
                  expiresIn: tokenExpiration
              }
          });
      } else {
          // WEB: Token en cookie HTTP-only (más seguro para browsers)
          // JavaScript lo manejará automáticamente via cookies
          res.cookie('auth_token', token, {
              httpOnly: true, // No accesible desde JavaScript (seguridad)
              secure: process.env.NODE_ENV === 'production', // HTTPS solo en producción
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
              maxAge: tokenExpiration * 1000, // Conversión a milisegundos
              domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined,
              path: '/'
          });

          return res.status(200).json({
              success: true,
              data: responseData // Sin token en el body para web
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

/**
 * Cierre de sesión (signout)
 * Maneja el logout diferenciado por plataforma
 */
export const signout = async (req, res) => {
  try {
      // Detectar plataforma desde el token o request
      const platform = req.user?.platform || getPlatformFromRequest(req);
      const isMobilePlatform = platform === 'android' || platform === 'ios';
      
      if (isMobilePlatform) {
          // MÓVIL: Solo confirmar logout (el token se elimina en el cliente)
          return res.status(200).json({
              success: true,
              message: "Sesión cerrada exitosamente"
          });
      } else {
          // WEB: Eliminar cookie del servidor
          res.clearCookie('auth_token', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
              path: '/',
              domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
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