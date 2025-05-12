import db from "../models/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import authConfig from "../config/auth.config.js";

const { user: User, role: Role } = db;

export const signup = async (req, res) => {
  try {
    const { username, email, password, roles, imei } = req.body;

    // Validar que los roles sean válidos
    const validRoles = await Role.findAll({
      where: { name: roles }
    });

    if (validRoles.length !== roles.length) {
      return res.status(400).json({
        success: false,
        message: "Uno o más roles no son válidos"
      });
    }

    // Verificar si el usuario es fiscalizador y tiene IMEI
    const isFiscalizador = roles.includes('fiscalizador');
    if (isFiscalizador && !imei) {
      return res.status(400).json({
        success: false,
        message: "Los fiscalizadores deben proporcionar un IMEI"
      });
    }

    // Verificar si el usuario es admin y no debe tener IMEI
    const isAdmin = roles.includes('admin');
    if (isAdmin && imei) {
      return res.status(400).json({
        success: false,
        message: "Los administradores no deben tener IMEI"
      });
    }

    // Verificar si el IMEI ya está en uso
    if (imei) {
      const existingUser = await User.findOne({ where: { imei } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "El IMEI ya está registrado"
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      imei: isFiscalizador ? imei : null,
      isActive: true
    });

    await user.setRoles(validRoles);

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: roles
      }
    });
  } catch (error) {
    console.error("Error en signup:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar el usuario",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const signin = async (req, res) => {
  try {
    const { username, password, imei } = req.body;

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
        roles: user.roles.map(role => role.name)
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

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles.map(role => role.name),
        accessToken: token,
        expiresIn: tokenExpiration,
        requiresImei: user.isFiscalizador()
      }
    });
  } catch (error) {
    console.error("Error en signin:", error);
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

