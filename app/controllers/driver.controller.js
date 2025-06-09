import db from "../models/index.js";
const { driver: Driver } = db;

// Listar conductores con paginación
export const listDrivers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6; // Fijo en 6 elementos como se solicitó
    const offset = (page - 1) * limit;

    // Ejecutar consultas en paralelo para mejor rendimiento
    const [drivers, totalDrivers] = await Promise.all([
      // Obtener conductores paginados
      Driver.findAll({
        attributes: [
          "dni",
          "firstName", 
          "lastName",
          "phoneNumber",
          "address"
        ],
        limit: limit,
        offset: offset,
        order: [["firstName", "ASC"], ["lastName", "ASC"]] // Ordenar alfabéticamente
      }),

      // Contar total de conductores
      Driver.count()
    ]);

    // Formatear los datos según los requerimientos
    const driversFormatted = drivers.map(driver => ({
      dni: driver.dni,
      nombreCompleto: `${driver.firstName} ${driver.lastName}`,
      telefono: driver.phoneNumber || "No registrado",
      direccion: driver.address || "No registrada",
      
      // Datos raw para flexibilidad del frontend
      firstName: driver.firstName,
      lastName: driver.lastName,
      phoneNumber: driver.phoneNumber,
      address: driver.address
    }));

    // Calcular información de paginación
    const totalPages = Math.ceil(totalDrivers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        conductores: driversFormatted,
        
        // Resumen estadístico
        summary: {
          total: totalDrivers,
          conTelefono: drivers.filter(d => d.phoneNumber).length,
          sinTelefono: drivers.filter(d => !d.phoneNumber).length,
          conDireccion: drivers.filter(d => d.address).length,
          sinDireccion: drivers.filter(d => !d.address).length
        },
        
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalDrivers,
          itemsPerPage: limit,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null
        }
      }
    });

  } catch (error) {
    console.error("Error en listDrivers:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la lista de conductores"
    });
  }
};

// Obtener conductor por DNI
export const getDriverByDni = async (req, res) => {
  try {
    const { dni } = req.params;

    const driver = await Driver.findByPk(dni, {
      attributes: [
        "dni",
        "firstName", 
        "lastName",
        "phoneNumber",
        "address",
        "photoUrl",
        "createdAt",
        "updatedAt"
      ]
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Conductor no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        dni: driver.dni,
        nombreCompleto: `${driver.firstName} ${driver.lastName}`,
        firstName: driver.firstName,
        lastName: driver.lastName,
        telefono: driver.phoneNumber,
        direccion: driver.address,
        photoUrl: driver.photoUrl,
        fechaRegistro: driver.createdAt,
        ultimaActualizacion: driver.updatedAt
      }
    });

  } catch (error) {
    console.error("Error en getDriverByDni:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el conductor"
    });
  }
};

// Buscar conductores por nombre o DNI
export const searchDrivers = async (req, res) => {
  try {
    const { q } = req.query; // query parameter para búsqueda
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "El término de búsqueda debe tener al menos 2 caracteres"
      });
    }

    const searchTerm = q.trim();
    const isNumeric = /^\d+$/.test(searchTerm);

    // Construir condiciones de búsqueda
    const whereConditions = [];
    
    if (isNumeric) {
      // Si es numérico, buscar por DNI
      whereConditions.push({
        dni: {
          [db.Sequelize.Op.like]: `${searchTerm}%`
        }
      });
    }

    // Siempre buscar por nombre (firstName o lastName)
    whereConditions.push({
      [db.Sequelize.Op.or]: [
        {
          firstName: {
            [db.Sequelize.Op.like]: `%${searchTerm}%`
          }
        },
        {
          lastName: {
            [db.Sequelize.Op.like]: `%${searchTerm}%`
          }
        }
      ]
    });

    const [drivers, totalDrivers] = await Promise.all([
      Driver.findAll({
        where: {
          [db.Sequelize.Op.or]: whereConditions
        },
        attributes: [
          "dni",
          "firstName", 
          "lastName",
          "phoneNumber",
          "address"
        ],
        limit: limit,
        offset: offset,
        order: [["firstName", "ASC"], ["lastName", "ASC"]]
      }),

      Driver.count({
        where: {
          [db.Sequelize.Op.or]: whereConditions
        }
      })
    ]);

    const driversFormatted = drivers.map(driver => ({
      dni: driver.dni,
      nombreCompleto: `${driver.firstName} ${driver.lastName}`,
      telefono: driver.phoneNumber || "No registrado",
      direccion: driver.address || "No registrada",
      firstName: driver.firstName,
      lastName: driver.lastName,
      phoneNumber: driver.phoneNumber,
      address: driver.address
    }));

    const totalPages = Math.ceil(totalDrivers / limit);

    res.status(200).json({
      success: true,
      data: {
        conductores: driversFormatted,
        searchTerm: searchTerm,
        summary: {
          total: totalDrivers,
          resultadosEncontrados: drivers.length
        },
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalDrivers,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error en searchDrivers:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar conductores"
    });
  }
};

// Estadísticas de conductores (para dashboard admin)
export const getDriversStats = async (req, res) => {
  try {
    const [totalDrivers, driversWithPhone, driversWithAddress, driversWithPhoto] = await Promise.all([
      Driver.count(),
      Driver.count({ where: { phoneNumber: { [db.Sequelize.Op.not]: null } } }),
      Driver.count({ where: { address: { [db.Sequelize.Op.not]: null } } }),
      Driver.count({ where: { photoUrl: { [db.Sequelize.Op.not]: null } } })
    ]);

    const stats = {
      total: totalDrivers,
      conTelefono: driversWithPhone,
      sinTelefono: totalDrivers - driversWithPhone,
      conDireccion: driversWithAddress,
      sinDireccion: totalDrivers - driversWithAddress,
      conFoto: driversWithPhoto,
      sinFoto: totalDrivers - driversWithPhoto,
      completitud: {
        telefono: totalDrivers > 0 ? ((driversWithPhone / totalDrivers) * 100).toFixed(1) : 0,
        direccion: totalDrivers > 0 ? ((driversWithAddress / totalDrivers) * 100).toFixed(1) : 0,
        foto: totalDrivers > 0 ? ((driversWithPhoto / totalDrivers) * 100).toFixed(1) : 0
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error en getDriversStats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de conductores"
    });
  }
};