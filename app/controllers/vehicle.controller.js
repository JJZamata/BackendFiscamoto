// controllers/vehicle.controller.js
import db from "../models/index.js";
import { Op } from "sequelize";

// Servicio para construir filtros dinámicos
const buildWhereCondition = (search, status, type) => {
  let whereCondition = {};
  
  if (search) {
    whereCondition[Op.or] = [
      { plateNumber: { [Op.like]: `%${search}%` } },
      { '$owner.first_name$': { [Op.like]: `%${search}%` } },//ojo qveriguar porque
      { '$owner.last_name$': { [Op.like]: `%${search}%` } },
      { '$company.name$': { [Op.like]: `%${search}%` } }
    ];
  }

  if (status) {
    whereCondition.vehicleStatus = status;
  }

  if (type) {
    // PROBLEMA CORREGIDO: En el original funciona con typeId, no type
    whereCondition.typeId = type;
  }

  return whereCondition;
};

// Servicio para formatear vehículos
const formatVehiclesResponse = (vehicles) => {
  return vehicles.map(vehicle => ({
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
};

// Controlador principal para listado de vehículos
export const getVehiclesList = async (req, res) => {
  try {
    // Parámetros de paginación con valores por defecto (como en el original)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    // Parámetros de filtro opcionales
    const { search, status, type, sortBy = 'plateNumber', sortOrder = 'ASC' } = req.query;

    // Construir filtros
    const whereCondition = buildWhereCondition(search, status, type);

    // PROBLEMA CORREGIDO: Ordenamiento debe ser exactamente como en el original
    const orderConfig = [[sortBy, sortOrder]];

    // Configuración de inclusiones (exacta del original)
    const includeConfig = [
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
    ];

    // Consulta optimizada (exacta del original)
    const { count, rows: vehicles } = await db.vehicle.findAndCountAll({
      where: whereCondition,
      include: includeConfig,
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
      order: orderConfig,
      distinct: true,
      subQuery: false
    });

    // Formatear respuesta
    const formattedVehicles = formatVehiclesResponse(vehicles);

    // Información de paginación (exacta del original)
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
      message: `Se encontraron ${count} vehículo${count !== 1 ? 's' : ''}`,
      meta: {
        appliedFilters: {
          search: search || null,
          status: status || null,
          type: type || null
        },
        sorting: {
          sortBy,
          sortOrder
        }
      }
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

// Controlador para estadísticas de vehículos - CORREGIDO
export const getVehiclesStats = async (req, res) => {
  try {
    const { dateFrom, dateTo, groupBy } = req.query;

    // Construir filtros de fecha si se proporcionan
    let dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt[Op.gte] = dateFrom;
      if (dateTo) dateFilter.createdAt[Op.lte] = dateTo;
    }

    // PROBLEMA CORREGIDO: Usar la misma estructura de columnas que el original
    const statusStats = await db.vehicle.findAll({
      where: dateFilter,
      attributes: [
        'vehicleStatus',
        [db.sequelize.fn('COUNT', db.sequelize.col('plate_number')), 'count']
      ],
      group: ['vehicleStatus'],
      raw: true
    });

    let additionalStats = {};

    // Estadísticas adicionales según groupBy
    if (groupBy === 'type' || !groupBy) {
      const typeStats = await db.vehicle.findAll({
        where: dateFilter,
        attributes: [
          [db.sequelize.col('vehicleType.name'), 'typeName'],
          // PROBLEMA CORREGIDO: Usar el alias correcto para la tabla
          [db.sequelize.fn('COUNT', db.sequelize.col('vehicles.plate_number')), 'count']
        ],
        include: [{
          model: db.vehicleType,
          as: 'vehicleType',
          attributes: []
        }],
        group: ['vehicleType.name'],
        raw: true
      });

      additionalStats.byType = typeStats.reduce((acc, stat) => {
        acc[stat.typeName] = parseInt(stat.count);
        return acc;
      }, {});
    }

    if (groupBy === 'brand' || !groupBy) {
      const brandStats = await db.vehicle.findAll({
        where: dateFilter,
        attributes: [
          'brand',
          [db.sequelize.fn('COUNT', db.sequelize.col('plate_number')), 'count']
        ],
        group: ['brand'],
        raw: true
      });

      additionalStats.byBrand = brandStats.reduce((acc, stat) => {
        acc[stat.brand] = parseInt(stat.count);
        return acc;
      }, {});
    }

    if (groupBy === 'year' || !groupBy) {
      const yearStats = await db.vehicle.findAll({
        where: dateFilter,
        attributes: [
          'manufacturingYear',
          [db.sequelize.fn('COUNT', db.sequelize.col('plate_number')), 'count']
        ],
        group: ['manufacturingYear'],
        order: [['manufacturingYear', 'ASC']],
        raw: true
      });

      additionalStats.byYear = yearStats.reduce((acc, stat) => {
        acc[stat.manufacturingYear] = parseInt(stat.count);
        return acc;
      }, {});
    }

    const formattedStatusStats = statusStats.reduce((acc, stat) => {
      acc[stat.vehicleStatus] = parseInt(stat.count);
      return acc;
    }, {});

    const totalVehicles = statusStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);

    res.status(200).json({
      success: true,
      data: {
        totalVehicles,
        byStatus: formattedStatusStats,
        ...additionalStats
      },
      meta: {
        dateRange: {
          from: dateFrom || null,
          to: dateTo || null
        },
        groupBy: groupBy || 'all'
      },
      message: `Estadísticas de ${totalVehicles} vehículos generadas`
    });

  } catch (error) {
    console.error("Error en getVehiclesStats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas de vehículos",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Controlador para obtener vehículo individual por placa
export const getVehicleById = async (req, res) => {
  try {
    const { plateNumber } = req.params;
    
    const vehicle = await db.vehicle.findOne({
      where: { plateNumber: plateNumber.toUpperCase() },
      include: [
        {
          model: db.owner,
          as: 'owner',
          attributes: ['dni', 'firstName', 'lastName', 'phone', 'email']
        },
        {
          model: db.company,
          as: 'company',
          attributes: ['ruc', 'name', 'rucStatus', 'address']
        },
        {
          model: db.vehicleType,
          as: 'vehicleType',
          attributes: ['typeId', 'name', 'description']
        }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehículo con placa ${plateNumber} no encontrado`
      });
    }

    const formattedVehicle = formatVehiclesResponse([vehicle])[0];

    res.status(200).json({
      success: true,
      data: formattedVehicle,
      message: "Vehículo encontrado exitosamente"
    });

  } catch (error) {
    console.error("Error en getVehicleById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el vehículo",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};