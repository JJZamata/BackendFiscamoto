import db from "../models/index.js";
const { user: User, role: Role } = db;

// Acceso público
export const allAccess = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Contenido público",
    version: "1.0.0"
  });
};

// Perfil del usuario
export const userProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [{
        model: Role,
        as: "roles",
        attributes: ["name", "description"]
      }],
      attributes: { exclude: ["password"] }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Error en userProfile:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el perfil del usuario"
    });
  }
};

// Actualizar perfil
export const updateProfile = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.userId);

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "El email ya está en uso"
        });
      }
      user.email = email;
    }

    if (currentPassword && newPassword) {
      const passwordIsValid = await bcrypt.compare(currentPassword, user.password);
      if (!passwordIsValid) {
        return res.status(401).json({
          success: false,
          message: "Contraseña actual incorrecta"
        });
      }
      user.password = await bcrypt.hash(newPassword, 8);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Perfil actualizado exitosamente"
    });
  } catch (error) {
    console.error("Error en updateProfile:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el perfil"
    });
  }
};

// Dashboard de administrador
export const adminDashboard = async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.count(),
      activeUsers: await User.count({ where: { isActive: true } }),
      fiscalizadores: await User.count({
        include: [{
          model: Role,
          as: "roles",
          where: { name: "fiscalizador" }
        }]
      }),
      admins: await User.count({
        include: [{
          model: Role,
          as: "roles",
          where: { name: "admin" }
        }]
      })
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error en adminDashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas del dashboard"
    });
  }
};

// Dashboard de fiscalizador
export const fiscalizadorDashboard = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ["id", "username", "email", "lastLogin", "lastLoginDevice"]
    });

    res.status(200).json({
      success: true,
      data: {
        user,
        lastActivity: user.lastLogin,
        device: user.lastLoginDevice
      }
    });
  } catch (error) {
    console.error("Error en fiscalizadorDashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el dashboard del fiscalizador"
    });
  }
};

// Listar usuarios (solo admin)
export const listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Role,
        as: "roles",
        attributes: ["name", "description"]
      }],
      attributes: { exclude: ["password"] }
    });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("Error en listUsers:", error);
    res.status(500).json({
      success: false,
      message: "Error al listar usuarios"
    });
  }
};

// Desactivar usuario (solo admin)
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    await user.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: "Usuario desactivado exitosamente"
    });
  } catch (error) {
    console.error("Error en deactivateUser:", error);
    res.status(500).json({
      success: false,
      message: "Error al desactivar usuario"
    });
  }
};

// Activar usuario (solo admin)
export const activateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    await user.update({ isActive: true });

    res.status(200).json({
      success: true,
      message: "Usuario activado exitosamente"
    });
  } catch (error) {
    console.error("Error en activateUser:", error);
    res.status(500).json({
      success: false,
      message: "Error al activar usuario"
    });
  }
};