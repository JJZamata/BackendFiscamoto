// users.controller.js
import db from "../models/index.js";
import { Op } from "sequelize";

// Controlador para obtener estadísticas y listado de usuarios
export const getUsersOverview = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6; // Según especificación: 6 elementos por página
    const offset = (page - 1) * limit;

    // Obtener estadísticas usando ORM
    const [totalUsers, activeUsers, adminUsers, fiscalizadorUsers] = await Promise.all([
      // Total de usuarios
      db.user.count(),
      
      // Usuarios activos
      db.user.count({
        where: { isActive: true }
      }),
      
      // Usuarios con rol admin
      db.user.count({
        include: [{
          model: db.role,
          as: 'roles',
          where: { name: 'admin' },
          through: { attributes: [] }
        }]
      }),
      
      // Usuarios con rol fiscalizador
      db.user.count({
        include: [{
          model: db.role,
          as: 'roles',
          where: { name: 'fiscalizador' },
          through: { attributes: [] }
        }]
      })
    ]);

    // Obtener listado de usuarios con paginación usando ORM
    const { count: totalRecords, rows: users } = await db.user.findAndCountAll({
      attributes: [
        'id', 
        'username', 
        'email', 
        'isActive', 
        'lastLogin', 
        'deviceConfigured', 
        'deviceInfo'
      ],
      include: [{
        model: db.role,
        as: 'roles',
        attributes: ['name'],
        through: { attributes: [] } // Excluir atributos de la tabla intermedia
      }],
      order: [['id', 'DESC']],
      limit: limit,
      offset: offset,
      distinct: true // Importante para que count sea correcto con includes
    });

    const totalPages = Math.ceil(totalRecords / limit);

    // Formatear los datos de los usuarios usando métodos del modelo
    const formattedUsers = users.map(user => {
      // Formatear información del dispositivo
      let dispositivoInfo = 'Sin dispositivo';
      if (user.deviceInfo) {
        try {
          const deviceData = user.deviceInfo; // Ya viene parseado por el getter del modelo
          
          if (deviceData && deviceData.deviceName) {
            dispositivoInfo = `${deviceData.deviceName} (${deviceData.platform || 'N/A'})`;
          } else if (deviceData && deviceData.deviceId) {
            dispositivoInfo = `ID: ${deviceData.deviceId.substring(0, 8)}...`;
          }
        } catch (e) {
          dispositivoInfo = 'Dispositivo configurado';
        }
      } else if (user.deviceConfigured) {
        dispositivoInfo = 'Configurado sin detalles';
      }

      // Formatear último acceso
      const ultimoAcceso = user.lastLogin 
        ? new Date(user.lastLogin).toLocaleString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Nunca';

      // Formatear roles usando los datos del include
      const rolesFormateados = user.roles && user.roles.length > 0
        ? user.roles.map(role => role.name).join(', ')
        : 'Sin rol';

      // Determinar estado
      const estado = user.isActive ? 'Activo' : 'Inactivo';

      return {
        id: user.id,
        usuario: user.username,
        email: user.email,
        rol: rolesFormateados,
        estado: estado,
        ultimo_acceso: ultimoAcceso,
        dispositivo: dispositivoInfo
      };
    });

    // Respuesta final
    res.status(200).json({
      success: true,
      data: {
        estadisticas: {
          total_usuarios: totalUsers,
          usuarios_activos: activeUsers,
          total_admins: adminUsers,
          total_fiscalizadores: fiscalizadorUsers
        },
        usuarios: formattedUsers,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_records: totalRecords,
          records_per_page: limit,
          has_next: page < totalPages,
          has_previous: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error en getUsersOverview:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener información de usuarios"
    });
  }
};

// Controlador para obtener información detallada de un usuario específico
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID del usuario es requerido"
      });
    }

    // Buscar usuario con roles usando ORM
    const user = await db.user.findByPk(id, {
      attributes: [
        'id', 
        'username', 
        'email', 
        'isActive', 
        'lastLogin', 
        'lastLoginIp',
        'lastLoginDevice',
        'deviceConfigured', 
        'deviceInfo',
        'createdAt',
        'updatedAt'
      ],
      include: [{
        model: db.role,
        as: 'roles',
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Formatear información del dispositivo
    let dispositivoInfo = null;
    if (user.deviceInfo) {
      dispositivoInfo = {
        configurado: user.deviceConfigured,
        detalles: user.deviceInfo
      };
    }

    // Formatear respuesta
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      roles: user.roles.map(role => ({
        id: role.id,
        name: role.name
      })),
      lastLogin: user.lastLogin,
      lastLoginIp: user.lastLoginIp,
      lastLoginDevice: user.lastLoginDevice,
      deviceConfigured: user.deviceConfigured,
      deviceInfo: dispositivoInfo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      data: userResponse
    });

  } catch (error) {
    console.error("Error en getUserById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener información del usuario"
    });
  }
};

// Controlador para obtener usuarios filtrados por rol
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params; // 'admin' o 'fiscalizador'
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    if (!['admin', 'fiscalizador'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rol no válido. Use 'admin' o 'fiscalizador'"
      });
    }

    // Obtener usuarios por rol usando ORM
    const { count: totalRecords, rows: users } = await db.user.findAndCountAll({
      attributes: [
        'id', 
        'username', 
        'email', 
        'isActive', 
        'lastLogin', 
        'deviceConfigured', 
        'deviceInfo'
      ],
      include: [{
        model: db.role,
        as: 'roles',
        attributes: ['name'],
        where: { name: role },
        through: { attributes: [] }
      }],
      order: [['username', 'ASC']],
      limit: limit,
      offset: offset,
      distinct: true
    });

    const totalPages = Math.ceil(totalRecords / limit);

    // Formatear usuarios
    const formattedUsers = users.map(user => ({
      id: user.id,
      usuario: user.username,
      email: user.email,
      estado: user.isActive ? 'Activo' : 'Inactivo',
      ultimo_acceso: user.lastLogin 
        ? new Date(user.lastLogin).toLocaleString('es-PE')
        : 'Nunca',
      dispositivo_configurado: user.deviceConfigured
    }));

    res.status(200).json({
      success: true,
      data: {
        rol_filtrado: role,
        usuarios: formattedUsers,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_records: totalRecords,
          records_per_page: limit,
          has_next: page < totalPages,
          has_previous: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error en getUsersByRole:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios por rol"
    });
  }
};