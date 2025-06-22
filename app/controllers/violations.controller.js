//controllers/violations.controller.js
import db from "../models/index.js";
const { violation: Violation } = db;

// Listar violaciones con paginación
export const listViolations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6; // 6 elementos por página
    const offset = (page - 1) * limit;

    // Obtener violaciones sin campos de timestamps
    const { count, rows: violations } = await Violation.findAndCountAll({
      attributes: [
        'id',
        'code',
        'description',
        'severity',
        'uitPercentage',
        'administrativeMeasure',
        'target'
      ],
      limit,
      offset,
      order: [['code', 'ASC']], // Ordenar por código de violación
      distinct: true
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        violations,
        pagination: {
          currentPage: page,
          totalPages,
          totalViolations: count,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null,
          limit
        }
      }
    });
  } catch (error) {
    console.error("Error en listViolations:", error);
    res.status(500).json({
      success: false,
      message: "Error al listar violaciones"
    });
  }
};

// Obtener detalles de una violación específica
export const getViolationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const violation = await Violation.findByPk(id, {
      attributes: [
        'id',
        'code',
        'description',
        'severity',
        'uitPercentage',
        'administrativeMeasure',
        'target'
      ]
    });

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: "Violación no encontrada"
      });
    }

    res.status(200).json({
      success: true,
      data: violation
    });
  } catch (error) {
    console.error("Error en getViolationDetails:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener detalles de la violación"
    });
  }
};

// Obtener estadísticas de violaciones
export const getViolationStats = async (req, res) => {
  try {
    const stats = {
      totalViolations: await Violation.count(),
      verySerious: await Violation.count({ where: { severity: 'very_serious' } }),
      serious: await Violation.count({ where: { severity: 'serious' } }),
      minor: await Violation.count({ where: { severity: 'minor' } }),
      driverTargeted: await Violation.count({ where: { target: 'driver-owner' } }),
      companyTargeted: await Violation.count({ where: { target: 'company' } })
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Error en getViolationStats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de violaciones"
    });
  }
};

// Filtrar violaciones por severidad
export const filterViolationsBySeverity = async (req, res) => {
  try {
    const { severity } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    const whereClause = severity ? { severity } : {};

    const { count, rows: violations } = await Violation.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'code',
        'description',
        'severity',
        'uitPercentage',
        'administrativeMeasure',
        'target'
      ],
      limit,
      offset,
      order: [['code', 'ASC']],
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        violations,
        pagination: {
          currentPage: page,
          totalPages,
          totalViolations: count,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        filter: {
          severity: severity || 'all'
        }
      }
    });
  } catch (error) {
    console.error("Error en filterViolationsBySeverity:", error);
    res.status(500).json({
      success: false,
      message: "Error al filtrar violaciones por severidad"
    });
  }
};

// Filtrar violaciones por target (driver-owner/company)
export const filterViolationsByTarget = async (req, res) => {
  try {
    const { target } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    const whereClause = target ? { target } : {};

    const { count, rows: violations } = await Violation.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'code',
        'description',
        'severity',
        'uitPercentage',
        'administrativeMeasure',
        'target'
      ],
      limit,
      offset,
      order: [['code', 'ASC']],
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        violations,
        pagination: {
          currentPage: page,
          totalPages,
          totalViolations: count,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        filter: {
          target: target || 'all'
        }
      }
    });
  } catch (error) {
    console.error("Error en filterViolationsByTarget:", error);
    res.status(500).json({
      success: false,
      message: "Error al filtrar violaciones por target"
    });
  }
};

// Buscar violaciones por código o descripción
export const searchViolations = async (req, res) => {
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
        { code: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } }
      ]
    };

    const { count, rows: violations } = await Violation.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'code',
        'description',
        'severity',
        'uitPercentage',
        'administrativeMeasure',
        'target'
      ],
      limit,
      offset,
      order: [['code', 'ASC']],
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        violations,
        pagination: {
          currentPage: page,
          totalPages,
          totalViolations: count,
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
    console.error("Error en searchViolations:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar violaciones"
    });
  }
};