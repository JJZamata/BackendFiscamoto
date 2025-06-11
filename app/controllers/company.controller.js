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