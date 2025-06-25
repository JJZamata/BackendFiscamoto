//controllers/company.controller.js
import db from "../models/index.js";
const { company: Company, vehicle: Vehicle } = db;

// Listar empresas con paginación
export const listCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6; // 6 elementos por página
    const offset = (page - 1) * limit;

    // Obtener empresas con conteo de vehículos
    const { count, rows: companies } = await Company.findAndCountAll({
      attributes: [
        'ruc',
        'name',
        'address',
        'expirationDate',
        'rucStatus',
        // Agregar conteo de vehículos usando subquery
        [
          db.sequelize.literal(`(
            SELECT COUNT(*)
            FROM vehicles
            WHERE vehicles.company_ruc = companies.ruc
          )`),
          'vehicleCount'
        ]
      ],
      limit,
      offset,
      order: [['name', 'ASC']], // Ordenar por nombre de empresa
      distinct: true
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        companies,
        pagination: {
          currentPage: page,
          totalPages,
          totalCompanies: count,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null,
          limit
        }
      }
    });
  } catch (error) {
    console.error("Error en listCompanies:", error);
    res.status(500).json({
      success: false,
      message: "Error al listar empresas"
    });
  }
};

// Obtener detalles de una empresa específica
export const getCompanyDetails = async (req, res) => {
  try {
    const { ruc } = req.params;

    const company = await Company.findByPk(ruc, {
      include: [{
        model: Vehicle,
        as: 'vehicles',
        attributes: ['plateNumber', 'vehicleStatus', 'brand', 'model', 'manufacturingYear']
      }]
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada"
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error("Error en getCompanyDetails:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalles de la empresa"
    });
  }
};

// Crear nueva empresa
export const createCompany = async (req, res) => {
  try {
    const { ruc, name, address, registrationDate, expirationDate, rucStatus } = req.body;

    // Validar campos requeridos
    if (!ruc || !name) {
      return res.status(400).json({
        success: false,
        message: "RUC y nombre son campos requeridos"
      });
    }

    // Validar formato de RUC (11 dígitos para Perú)
    if (!/^\d{11}$/.test(ruc)) {
      return res.status(400).json({
        success: false,
        message: "El RUC debe tener exactamente 11 dígitos"
      });
    }

    // Verificar si la empresa ya existe
    const existingCompany = await Company.findByPk(ruc);
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una empresa con este RUC"
      });
    }

    // Validar estado RUC
    const validStatuses = ['ACTIVO', 'SUSPENDIDO', 'BAJA PROV.'];
    if (rucStatus && !validStatuses.includes(rucStatus)) {
      return res.status(400).json({
        success: false,
        message: "Estado RUC inválido. Debe ser: ACTIVO, SUSPENDIDO, o BAJA PROV."
      });
    }

    // Validar fecha de expiración
    if (expirationDate && new Date(expirationDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "La fecha de expiración debe ser posterior a la fecha actual"
      });
    }

    const newCompany = await Company.create({
      ruc,
      name: name.trim(),
      address: address?.trim() || null,
      registrationDate: registrationDate || null,
      expirationDate: expirationDate || null,
      rucStatus: rucStatus || 'ACTIVO'
    });

    res.status(201).json({
      success: true,
      message: "Empresa creada exitosamente",
      data: newCompany
    });
  } catch (error) {
    console.error("Error en createCompany:", error);
    
    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear la empresa"
    });
  }
};

// Actualizar empresa
export const updateCompany = async (req, res) => {
  try {
    const { ruc } = req.params;
    const { name, address, expirationDate, rucStatus } = req.body;

    // Buscar la empresa
    const company = await Company.findByPk(ruc);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada"
      });
    }

    // Validar campos si se proporcionan
    if (name && name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "El nombre no puede estar vacío"
      });
    }

    if (rucStatus) {
      const validStatuses = ['ACTIVO', 'SUSPENDIDO', 'BAJA PROV.'];
      if (!validStatuses.includes(rucStatus)) {
        return res.status(400).json({
          success: false,
          message: "Estado RUC inválido. Debe ser: ACTIVO, SUSPENDIDO, o BAJA PROV."
        });
      }
    }

    if (expirationDate && new Date(expirationDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "La fecha de expiración debe ser posterior a la fecha actual"
      });
    }

    // Actualizar solo los campos proporcionados
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (expirationDate !== undefined) updateData.expirationDate = expirationDate;
    if (rucStatus !== undefined) updateData.rucStatus = rucStatus;

    await company.update(updateData);

    // Obtener la empresa actualizada
    const updatedCompany = await Company.findByPk(ruc);

    res.status(200).json({
      success: true,
      message: "Empresa actualizada exitosamente",
      data: updatedCompany
    });
  } catch (error) {
    console.error("Error en updateCompany:", error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar la empresa"
    });
  }
};

// Eliminar empresa
export const deleteCompany = async (req, res) => {
  try {
    const { ruc } = req.params;

    // Buscar la empresa
    const company = await Company.findByPk(ruc);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada"
      });
    }

    // Verificar si la empresa tiene vehículos asociados
    const vehicleCount = await Vehicle.count({
      where: { company_ruc: ruc }
    });

    if (vehicleCount > 0) {
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar la empresa. Tiene ${vehicleCount} vehículo(s) asociado(s). Elimine o reasigne los vehículos primero.`
      });
    }

    // Eliminar la empresa
    await company.destroy();

    res.status(200).json({
      success: true,
      message: "Empresa eliminada exitosamente"
    });
  } catch (error) {
    console.error("Error en deleteCompany:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la empresa"
    });
  }
};

// Eliminación masiva de empresas (solo admin)
export const bulkDeleteCompanies = async (req, res) => {
  try {
    const { rucList } = req.body;

    if (!Array.isArray(rucList) || rucList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere una lista de RUCs válida"
      });
    }

    // Verificar que ninguna empresa tenga vehículos asociados
    const companiesWithVehicles = await Company.findAll({
      where: { ruc: rucList },
      include: [{
        model: Vehicle,
        as: 'vehicles',
        required: true,
        attributes: []
      }],
      attributes: ['ruc', 'name']
    });

    if (companiesWithVehicles.length > 0) {
      return res.status(409).json({
        success: false,
        message: "No se pueden eliminar algunas empresas porque tienen vehículos asociados",
        data: {
          companiesWithVehicles: companiesWithVehicles.map(c => ({
            ruc: c.ruc,
            name: c.name
          }))
        }
      });
    }

    // Eliminar empresas
    const deletedCount = await Company.destroy({
      where: { ruc: rucList }
    });

    res.status(200).json({
      success: true,
      message: `${deletedCount} empresa(s) eliminada(s) exitosamente`,
      data: {
        deletedCount,
        requestedCount: rucList.length
      }
    });
  } catch (error) {
    console.error("Error en bulkDeleteCompanies:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar empresas en lote"
    });
  }
};

// Obtener estadísticas de empresas
export const getCompanyStats = async (req, res) => {
  try {
    const stats = {
      totalCompanies: await Company.count(),
      activeCompanies: await Company.count({ where: { rucStatus: 'ACTIVO' } }),
      suspendedCompanies: await Company.count({ where: { rucStatus: 'SUSPENDIDO' } }),
      lowProvCompanies: await Company.count({ where: { rucStatus: 'BAJA PROV.' } }),
      totalVehicles: await Vehicle.count(),
      companiesWithVehicles: await Company.count({
        include: [{
          model: Vehicle,
          as: 'vehicles',
          required: true
        }]
      })
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error en getCompanyStats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de empresas"
    });
  }
};

// Filtrar empresas por estado RUC
export const filterCompaniesByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    const whereClause = status ? { rucStatus: status } : {};

    const { count, rows: companies } = await Company.findAndCountAll({
      where: whereClause,
      attributes: [
        'ruc',
        'name',
        'expirationDate',
        'rucStatus',
        [
          db.sequelize.literal(`(
            SELECT COUNT(*)
            FROM vehicles
            WHERE vehicles.company_ruc = companies.ruc
          )`),
          'vehicleCount'
        ]
      ],
      limit,
      offset,
      order: [['name', 'ASC']],
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        companies,
        pagination: {
          currentPage: page,
          totalPages,
          totalCompanies: count,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        filter: {
          status: status || 'all'
        }
      }
    });
  } catch (error) {
    console.error("Error en filterCompaniesByStatus:", error);
    res.status(500).json({
      success: false,
      message: "Error al filtrar empresas por estado"
    });
  }
};

// Buscar empresas por nombre o RUC
export const searchCompanies = async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Parámetro de búsqueda requerido"
      });
    }

    const { Op } = db.Sequelize;
    const whereClause = {
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { ruc: { [Op.like]: `%${query}%` } }
      ]
    };

    const { count, rows: companies } = await Company.findAndCountAll({
      where: whereClause,
      attributes: [
        'ruc',
        'name',
        'expirationDate',
        'rucStatus',
        [
          db.sequelize.literal(`(
            SELECT COUNT(*)
            FROM vehicles
            WHERE vehicles.company_ruc = companies.ruc
          )`),
          'vehicleCount'
        ]
      ],
      limit,
      offset,
      order: [['name', 'ASC']],
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        companies,
        pagination: {
          currentPage: page,
          totalPages,
          totalCompanies: count,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        search: {
          query,
          resultsFound: count
        }
      }
    });
  } catch (error) {
    console.error("Error en searchCompanies:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar empresas"
    });
  }
};