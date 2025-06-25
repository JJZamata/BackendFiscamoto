//driver.controller.js
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

// Obtener conductor por DNI con información de licencia
export const getDriverByDni = async (req, res) => {
  try {
    const { dni } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Verificar que el conductor existe
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

    // Obtener las licencias del conductor con paginación
    const [licenses, totalLicenses] = await Promise.all([
      db.drivingLicense.findAll({
        where: { driverDni: dni },
        attributes: [
          'licenseId',
          'licenseNumber',
          'category',
          'issueDate',
          'expirationDate',
          'issuingEntity',
          'restrictions',
          'createdAt',
          'updatedAt'
        ],
        limit: limit,
        offset: offset,
        order: [['expirationDate', 'DESC']]
      }),
      db.drivingLicense.count({ where: { driverDni: dni } })
    ]);

    // Formatear las licencias con estado
    const today = new Date();
    const licensesFormatted = licenses.map(license => {
      const expirationDate = new Date(license.expirationDate);
      const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
      
      let status = "vigente";
      if (daysUntilExpiration < 0) {
        status = "vencida";
      } else if (daysUntilExpiration <= 30) {
        status = "por_vencer";
      }

      return {
        licenseId: license.licenseId,
        licenseNumber: license.licenseNumber,
        category: license.category,
        issueDate: license.issueDate,
        expirationDate: license.expirationDate,
        issuingEntity: license.issuingEntity,
        restrictions: license.restrictions,
        estado: status,
        diasParaVencimiento: daysUntilExpiration > 0 ? daysUntilExpiration : 0,
        fechaCreacion: license.createdAt,
        ultimaActualizacion: license.updatedAt
      };
    });

    const totalPages = Math.ceil(totalLicenses / limit);

    res.status(200).json({
      success: true,
      data: {
        // Información del conductor
        conductor: {
          dni: driver.dni,
          nombreCompleto: `${driver.firstName} ${driver.lastName}`,
          firstName: driver.firstName,
          lastName: driver.lastName,
          phoneNumber: driver.phoneNumber,
          address: driver.address,
          photoUrl: driver.photoUrl,
          fechaRegistro: driver.createdAt,
          ultimaActualizacion: driver.updatedAt
        },
        // Información de las licencias
        licencias: licensesFormatted,
        summary: {
          total: totalLicenses,
          vigentes: licensesFormatted.filter(l => l.estado === 'vigente').length,
          porVencer: licensesFormatted.filter(l => l.estado === 'por_vencer').length,
          vencidas: licensesFormatted.filter(l => l.estado === 'vencida').length
        },
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalLicenses,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
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
export const createDriver = async (req, res) => {
  try {
    const { dni, firstName, lastName, phoneNumber, address, photoUrl } = req.body;

    // Validaciones básicas
    if (!dni || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "DNI, nombres y apellidos son campos obligatorios",
        field: !dni ? "dni" : !firstName ? "firstName" : "lastName"
      });
    }

    // Validar formato DNI
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: "El DNI debe tener exactamente 8 dígitos numéricos",
        field: "dni"
      });
    }

    // Validar nombres (solo letras, espacios y acentos)
    const nameRegex = /^[A-ZÁÉÍÓÚÑ\s]+$/i;
    if (!nameRegex.test(firstName)) {
      return res.status(400).json({
        success: false,
        message: "Los nombres solo pueden contener letras y espacios",
        field: "firstName"
      });
    }

    if (!nameRegex.test(lastName)) {
      return res.status(400).json({
        success: false,
        message: "Los apellidos solo pueden contener letras y espacios",
        field: "lastName"
      });
    }

    // Validar teléfono si se proporciona
    if (phoneNumber && (!/^[0-9+\-\s()]*$/.test(phoneNumber) || phoneNumber.length < 9 || phoneNumber.length > 15)) {
      return res.status(400).json({
        success: false,
        message: "El teléfono debe tener entre 9 y 15 caracteres y solo contener números, +, -, espacios y paréntesis",
        field: "phoneNumber"
      });
    }

    // Verificar si el conductor ya existe
    const existingDriver = await Driver.findByPk(dni);
    if (existingDriver) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un conductor con este DNI",
        field: "dni"
      });
    }

    // Crear el conductor
    const newDriver = await Driver.create({
      dni: dni.trim(),
      firstName: firstName.trim().toUpperCase(),
      lastName: lastName.trim().toUpperCase(),
      phoneNumber: phoneNumber?.trim() || null,
      address: address?.trim() || null,
      photoUrl: photoUrl?.trim() || null
    });

    res.status(201).json({
      success: true,
      message: "Conductor creado exitosamente",
      data: {
        dni: newDriver.dni,
        nombreCompleto: `${newDriver.firstName} ${newDriver.lastName}`,
        firstName: newDriver.firstName,
        lastName: newDriver.lastName,
        telefono: newDriver.phoneNumber,
        direccion: newDriver.address,
        photoUrl: newDriver.photoUrl,
        fechaRegistro: newDriver.createdAt
      }
    });

  } catch (error) {
    console.error("Error en createDriver:", error);
    
    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const validationError = error.errors[0];
      return res.status(400).json({
        success: false,
        message: validationError.message,
        field: validationError.path
      });
    }

    // Manejar error de DNI duplicado
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: "Ya existe un conductor con este DNI",
        field: "dni"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear el conductor"
    });
  }
};

// Actualizar conductor
export const updateDriver = async (req, res) => {
  try {
    const { dni } = req.params;
    const { firstName, lastName, phoneNumber, address, photoUrl } = req.body;

    // Verificar que existe el conductor
    const existingDriver = await Driver.findByPk(dni);
    if (!existingDriver) {
      return res.status(404).json({
        success: false,
        message: "Conductor no encontrado"
      });
    }

    // Objeto para almacenar solo los campos que se van a actualizar
    const updateData = {};

    // Validar y preparar firstName si se proporciona
    if (firstName !== undefined) {
      if (!firstName || firstName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Los nombres no pueden estar vacíos",
          field: "firstName"
        });
      }

      if (!/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(firstName)) {
        return res.status(400).json({
          success: false,
          message: "Los nombres solo pueden contener letras y espacios",
          field: "firstName"
        });
      }

      updateData.firstName = firstName.trim().toUpperCase();
    }

    // Validar y preparar lastName si se proporciona
    if (lastName !== undefined) {
      if (!lastName || lastName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Los apellidos no pueden estar vacíos",
          field: "lastName"
        });
      }

      if (!/^[A-ZÁÉÍÓÚÑ\s]+$/i.test(lastName)) {
        return res.status(400).json({
          success: false,
          message: "Los apellidos solo pueden contener letras y espacios",
          field: "lastName"
        });
      }

      updateData.lastName = lastName.trim().toUpperCase();
    }

    // Validar y preparar phoneNumber si se proporciona
    if (phoneNumber !== undefined) {
      if (phoneNumber === null || phoneNumber === "") {
        updateData.phoneNumber = null;
      } else {
        if (!/^[0-9+\-\s()]*$/.test(phoneNumber) || phoneNumber.length < 9 || phoneNumber.length > 15) {
          return res.status(400).json({
            success: false,
            message: "El teléfono debe tener entre 9 y 15 caracteres y solo contener números, +, -, espacios y paréntesis",
            field: "phoneNumber"
          });
        }
        updateData.phoneNumber = phoneNumber.trim();
      }
    }

    // Validar y preparar address si se proporciona
    if (address !== undefined) {
      updateData.address = address === null || address === "" ? null : address.trim();
    }

    // Validar y preparar photoUrl si se proporciona
    if (photoUrl !== undefined) {
      if (photoUrl === null || photoUrl === "") {
        updateData.photoUrl = null;
      } else {
        // Validación básica de URL
        try {
          new URL(photoUrl);
          updateData.photoUrl = photoUrl.trim();
        } catch {
          return res.status(400).json({
            success: false,
            message: "La URL de la foto no es válida",
            field: "photoUrl"
          });
        }
      }
    }

    // Verificar si hay algo que actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron campos para actualizar"
      });
    }

    // Actualizar el conductor
    await existingDriver.update(updateData);

    // Recargar los datos actualizados
    await existingDriver.reload();

    res.status(200).json({
      success: true,
      message: "Conductor actualizado exitosamente",
      data: {
        dni: existingDriver.dni,
        nombreCompleto: `${existingDriver.firstName} ${existingDriver.lastName}`,
        firstName: existingDriver.firstName,
        lastName: existingDriver.lastName,
        telefono: existingDriver.phoneNumber,
        direccion: existingDriver.address,
        photoUrl: existingDriver.photoUrl,
        fechaRegistro: existingDriver.createdAt,
        ultimaActualizacion: existingDriver.updatedAt
      }
    });

  } catch (error) {
    console.error("Error en updateDriver:", error);
    
    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const validationError = error.errors[0];
      return res.status(400).json({
        success: false,
        message: validationError.message,
        field: validationError.path
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar el conductor"
    });
  }
};

// Eliminar conductor
export const deleteDriver = async (req, res) => {
  try {
    const { dni } = req.params;

    // Verificar que existe el conductor
    const existingDriver = await Driver.findByPk(dni);
    if (!existingDriver) {
      return res.status(404).json({
        success: false,
        message: "Conductor no encontrado"
      });
    }

    // Guardar datos para la respuesta antes de eliminar
    const driverData = {
      dni: existingDriver.dni,
      nombreCompleto: `${existingDriver.firstName} ${existingDriver.lastName}`,
      fechaRegistro: existingDriver.createdAt
    };

    // Eliminar el conductor
    await existingDriver.destroy();

    res.status(200).json({
      success: true,
      message: "Conductor eliminado exitosamente",
      data: driverData
    });

  } catch (error) {
    console.error("Error en deleteDriver:", error);
    
    // Manejar restricciones de clave foránea si las hubiera
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar el conductor porque tiene registros asociados"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al eliminar el conductor"
    });
  }
};