// controllers/vehicle.controller.js
import db from "../models/index.js";
import { Op } from "sequelize";

// Servicio para construir filtros dinámicos
const buildWhereCondition = (search, status, type) => {
  let whereCondition = {};
  
  if (search) {
    whereCondition[Op.or] = [
      { plateNumber: { [Op.like]: `%${search}%` } },
      { '$owner.first_name$': { [Op.like]: `%${search}%` } },
      { '$owner.last_name$': { [Op.like]: `%${search}%` } },
      { '$company.name$': { [Op.like]: `%${search}%` } }
    ];
  }

  if (status) {
    whereCondition.vehicleStatus = status;
  }

  if (type) {
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

// CREATE - Crear nuevo vehículo
export const createVehicle = async (req, res) => {
  try {
    const {
      plateNumber,
      companyRuc,
      ownerDni,
      typeId,
      vehicleStatus = 'OPERATIVO',
      brand,
      model,
      manufacturingYear
    } = req.body;

    // Verificar si ya existe un vehículo con esa placa
    const existingVehicle = await db.vehicle.findOne({
      where: { plateNumber: plateNumber.toUpperCase() }
    });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un vehículo con la placa ${plateNumber}`
      });
    }

    // Verificar que existan las referencias
    const [company, owner, vehicleType] = await Promise.all([
      db.company.findOne({ where: { ruc: companyRuc } }),
      db.owner.findOne({ where: { dni: ownerDni } }),
      db.vehicleType.findOne({ where: { typeId: typeId } })
    ]);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: `Empresa con RUC ${companyRuc} no encontrada`
      });
    }

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: `Propietario con DNI ${ownerDni} no encontrado`
      });
    }

    if (!vehicleType) {
      return res.status(404).json({
        success: false,
        message: `Tipo de vehículo con ID ${typeId} no encontrado`
      });
    }

    // Crear el vehículo
    const newVehicle = await db.vehicle.create({
      plateNumber: plateNumber.toUpperCase(),
      companyRuc,
      ownerDni,
      typeId,
      vehicleStatus,
      brand,
      model,
      manufacturingYear
    });

    // Obtener el vehículo creado con sus relaciones
    const createdVehicle = await db.vehicle.findOne({
      where: { plateNumber: newVehicle.plateNumber },
      include: [
        {
          model: db.owner,
          as: 'owner',
          attributes: ['dni', 'firstName', 'lastName']
        },
        {
          model: db.company,
          as: 'company',
          attributes: ['ruc', 'name', 'rucStatus']
        },
        {
          model: db.vehicleType,
          as: 'vehicleType',
          attributes: ['typeId', 'name']
        }
      ]
    });

    const formattedVehicle = formatVehiclesResponse([createdVehicle])[0];

    res.status(201).json({
      success: true,
      data: formattedVehicle,
      message: `Vehículo con placa ${plateNumber} creado exitosamente`
    });

  } catch (error) {
    console.error("Error en createVehicle:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el vehículo",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// UPDATE - Actualizar vehículo
export const updateVehicle = async (req, res) => {
  try {
    const { plateNumber } = req.params;
    const {
      companyRuc,
      ownerDni,
      typeId,
      vehicleStatus,
      brand,
      model,
      manufacturingYear
    } = req.body;

    // Verificar que el vehículo existe
    const existingVehicle = await db.vehicle.findOne({
      where: { plateNumber: plateNumber.toUpperCase() }
    });

    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehículo con placa ${plateNumber} no encontrado`
      });
    }

    // Verificar referencias si se proporcionan
    const validationPromises = [];
    
    if (companyRuc) {
      validationPromises.push(
        db.company.findOne({ where: { ruc: companyRuc } }).then(company => {
          if (!company) throw new Error(`Empresa con RUC ${companyRuc} no encontrada`);
        })
      );
    }

    if (ownerDni) {
      validationPromises.push(
        db.owner.findOne({ where: { dni: ownerDni } }).then(owner => {
          if (!owner) throw new Error(`Propietario con DNI ${ownerDni} no encontrado`);
        })
      );
    }

    if (typeId) {
      validationPromises.push(
        db.vehicleType.findOne({ where: { typeId: typeId } }).then(vehicleType => {
          if (!vehicleType) throw new Error(`Tipo de vehículo con ID ${typeId} no encontrado`);
        })
      );
    }

    try {
      await Promise.all(validationPromises);
    } catch (validationError) {
      return res.status(404).json({
        success: false,
        message: validationError.message
      });
    }

    // Actualizar el vehículo
    const updatedData = {};
    if (companyRuc) updatedData.companyRuc = companyRuc;
    if (ownerDni) updatedData.ownerDni = ownerDni;
    if (typeId) updatedData.typeId = typeId;
    if (vehicleStatus) updatedData.vehicleStatus = vehicleStatus;
    if (brand) updatedData.brand = brand;
    if (model) updatedData.model = model;
    if (manufacturingYear) updatedData.manufacturingYear = manufacturingYear;

    await db.vehicle.update(updatedData, {
      where: { plateNumber: plateNumber.toUpperCase() }
    });

    // Obtener el vehículo actualizado con sus relaciones
    const updatedVehicle = await db.vehicle.findOne({
      where: { plateNumber: plateNumber.toUpperCase() },
      include: [
        {
          model: db.owner,
          as: 'owner',
          attributes: ['dni', 'firstName', 'lastName']
        },
        {
          model: db.company,
          as: 'company',
          attributes: ['ruc', 'name', 'rucStatus']
        },
        {
          model: db.vehicleType,
          as: 'vehicleType',
          attributes: ['typeId', 'name']
        }
      ]
    });

    const formattedVehicle = formatVehiclesResponse([updatedVehicle])[0];

    res.status(200).json({
      success: true,
      data: formattedVehicle,
      message: `Vehículo con placa ${plateNumber} actualizado exitosamente`
    });

  } catch (error) {
    console.error("Error en updateVehicle:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el vehículo",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// DELETE - Eliminar vehículo
export const deleteVehicle = async (req, res) => {
  try {
    const { plateNumber } = req.params;

    // Verificar que el vehículo existe
    const existingVehicle = await db.vehicle.findOne({
      where: { plateNumber: plateNumber.toUpperCase() }
    });

    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: `Vehículo con placa ${plateNumber} no encontrado`
      });
    }

    // Eliminar el vehículo
    await db.vehicle.destroy({
      where: { plateNumber: plateNumber.toUpperCase() }
    });

    res.status(200).json({
      success: true,
      message: `Vehículo con placa ${plateNumber} eliminado exitosamente`
    });

  } catch (error) {
    console.error("Error en deleteVehicle:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el vehículo",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// READ - Controlador principal para listado de vehículos
export const getVehiclesList = async (req, res) => {
  try {
    // Parámetros de paginación con valores por defecto
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    // Parámetros de filtro opcionales
    const { search, status, type, sortBy = 'plateNumber', sortOrder = 'ASC' } = req.query;

    // Construir filtros
    const whereCondition = buildWhereCondition(search, status, type);

    // Ordenamiento
    const orderConfig = [[sortBy, sortOrder]];

    // Configuración de inclusiones
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

    // Consulta optimizada
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

// READ - Controlador para estadísticas de vehículos
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

// READ - Controlador para obtener vehículo individual por placa
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