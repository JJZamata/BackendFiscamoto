import db from "../models/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import authConfig from "../config/auth.config.js";

const { user: User, role: Role } = db;

export const signup = async (req, res) => {
  try {
    const { username, email, password, roles, imei } = req.body;

    // Verificación específica para fiscalizadores
    const isFiscalizador = roles.includes('fiscalizador');
    if (isFiscalizador && !imei) {
      return res.status(400).json({
        success: false,
        message: "Los fiscalizadores deben proporcionar un IMEI",
        field: "imei"
      });
    }

    // Verificación para administradores
    const isAdmin = roles.includes('admin');
    if (isAdmin && imei) {
      return res.status(400).json({
        success: false,
        message: "Los administradores no deben tener IMEI",
        field: "imei"
      });
    }

    // Creación del usuario
    const user = await db.user.create({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      imei: isFiscalizador ? imei : null
    });

    // Asignación de roles
    const roleInstances = await db.role.findAll({
      where: { name: roles }
    });
    await user.setRoles(roleInstances);

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        id: user.id,
        username: user.username,
        roles: roleInstances.map(role => role.name)
      }
    });

  } catch (error) {
    console.error("Error en signup:", error);
    
    // Manejo específico para errores de Sequelize (duplicados)
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'campo';
      return res.status(400).json({
        success: false,
        message: `Error de duplicidad: El ${field} ya está en uso`,
        field,
        details: process.env.NODE_ENV === 'development' ? error.errors : undefined
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const signin = async (req, res) => {
  try {
    const { username, password, imei, clientType } = req.body;
    const isMobileClient = clientType === 'mobile';

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

    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: "Contraseña inválida"
      });
    }

    // Verificar IMEI para fiscalizadores
    if (user.isFiscalizador()) {
      if (!imei) {
        return res.status(400).json({
          success: false,
          message: "Se requiere el IMEI del dispositivo para fiscalizadores"
        });
      }
      if (imei !== user.imei) {
        return res.status(401).json({
          success: false,
          message: "IMEI no válido para este fiscalizador"
        });
      }
    }

    // Obtener configuración específica del rol
    const roleConfig = authConfig.roles[user.roles[0].name];
    const tokenExpiration = roleConfig ? roleConfig.tokenExpiration : authConfig.jwtExpiration;

    const token = jwt.sign(
      { 
        id: user.id,
        roles: user.roles.map(role => role.name),
        clientType: isMobileClient ? 'mobile' : 'web'
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

    // Preparar respuesta base
    const responseData = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles.map(role => role.name),
      requiresImei: user.isFiscalizador()
    };

    if (isMobileClient) {
      // Para clientes móviles, enviar el token en el cuerpo de la respuesta
      return res.status(200).json({
        success: true,
        data: {
          ...responseData,
          accessToken: token,
          expiresIn: tokenExpiration
        }
      });
    } else {
      // Para clientes web, establecer cookie segura
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokenExpiration * 1000, // Convertir a milisegundos
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

export const signout = async (req, res) => {
  try {
    const clientType = req.user?.clientType || req.body.clientType;
    
    if (clientType === 'mobile') {
      // Para móvil, solo necesitamos responder con éxito
      return res.status(200).json({
        success: true,
        message: "Sesión cerrada exitosamente"
      });
    } else {
      // Para web, limpiar la cookie
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

