// controllers/vehicle.controller.js
import db from "../models/index.js";
import { Op } from "sequelize";

// Controlador para obtener listado de vehículos con paginación
export const getVehiclesList = async (req, res) => {
  try {
    // Parámetros de paginación con valores por defecto
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    // Parámetros de filtro opcionales
    const { search, status, type } = req.query;

    // Construcción dinámica de filtros
    let whereCondition = {};
    
    if (search) {
      whereCondition[Op.or] = [
        { plateNumber: { [Op.like]: `%${search}%` } },
        { '$owner.firstName$': { [Op.like]: `%${search}%` } },
        { '$owner.lastName$': { [Op.like]: `%${search}%` } },
        { '$company.name$': { [Op.like]: `%${search}%` } }
      ];
    }

    if (status) {
      whereCondition.vehicleStatus = status;
    }

    if (type) {
      whereCondition.typeId = type;
    }

    // Consulta con paginación e incluir relaciones
    const { count, rows: vehicles } = await db.vehicle.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: db.owner,
          as: 'owner',
          attributes: ['dni', 'firstName', 'lastName'],
          required: true
        },
        {
          model: db.company,
          as: 'company',
          attributes: ['ruc', 'name', 'rucStatus'],
          required: true
        },
        {
          model: db.vehicleType,
          as: 'vehicleType',
          attributes: ['typeId', 'name'],
          required: true
        }
      ],
      attributes: [
        'plateNumber',
        'companyRuc',
        'ownerDni',
        'vehicleStatus',
        'brand',
        'model',
        'manufacturingYear'
      ],
      limit,
      offset,
      order: [['plateNumber', 'ASC']],
      distinct: true, // Para contar correctamente con JOINs
      subQuery: false
    });

    // Formatear los datos según requerimientos
    const formattedVehicles = vehicles.map(vehicle => ({
      placa: {
        plateNumber: vehicle.plateNumber,
        companyRuc: vehicle.companyRuc
      },
      propietario: {
        nombreCompleto: `${vehicle.owner.firstName} ${vehicle.owner.lastName}`,
        dni: vehicle.owner.dni
      },
      empresa: {
        nombre: vehicle.company.name,
        ruc: vehicle.company.ruc,
        estado: vehicle.company.rucStatus
      },
      tipo: {
        categoria: vehicle.vehicleType.name,
        marca: vehicle.brand,
        modelo: vehicle.model,
        año: vehicle.manufacturingYear,
        vehicleInfo: `${vehicle.brand} ${vehicle.model} (${vehicle.manufacturingYear})`
      },
      estado: vehicle.vehicleStatus
    }));

    // Información de paginación
    const totalPages = Math.ceil(count / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: count,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null
    };

    res.status(200).json({
      success: true,
      data: {
        vehicles: formattedVehicles,
        pagination
      },
      message: `Se encontraron ${count} vehículos`
    });

  } catch (error) {
    console.error("Error en getVehiclesList:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el listado de vehículos",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Controlador adicional para obtener estadísticas de vehículos
export const getVehiclesStats = async (req, res) => {
  try {
    const stats = await db.vehicle.findAll({
      attributes: [
        'vehicleStatus',
        [db.sequelize.fn('COUNT', db.sequelize.col('plate_number')), 'count']
      ],
      group: ['vehicleStatus'],
      raw: true
    });

    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat.vehicleStatus] = parseInt(stat.count);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalVehicles: stats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
        byStatus: formattedStats
      }
    });

  } catch (error) {
    console.error("Error en getVehiclesStats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de vehículos"
    });
  }
};