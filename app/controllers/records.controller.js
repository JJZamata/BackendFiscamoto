// controllers/records.controller.js
import db from "../models/index.js";
import { Op } from "sequelize";

const {
  compliantRecord: CompliantRecords,
  nonCompliantRecord: NonCompliantRecords,
  controlRecord: ControlRecords,
  photo: Photos,
  recordPhoto: RecordPhotos,
  drivingLicense: DrivingLicenses,
  driver: Drivers,
  user: User,
  vehicle: Vehicles,
  company: Companies,
  violation: Violations,
  recordViolation: RecordViolations,
  sequelize
} = db;

// Obtener todas las actas (conformes y no conformes) con paginado, búsqueda y filtros
export const getAllRecords = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const recordType = req.query.type || 'all'; // 'all', 'conforme', 'noconforme'
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Configurar condiciones de búsqueda
    let searchConditions = {};
    if (search) {
      searchConditions = {
        [Op.or]: [
          { vehicle_plate: { [Op.iLike]: `%${search}%` } },
          { location: { [Op.iLike]: `%${search}%` } },
          { observations: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    // Configurar includes comunes
    const commonIncludes = [
      {
        model: User,
        as: 'inspector',
        attributes: ['id', 'username', 'email']
      },
      {
        model: DrivingLicenses,
        as: 'license',
        required: false,
        attributes: ['licenseId', 'licenseNumber', 'category'],
        include: [{
          model: Drivers,
          as: 'driver',
          required: false,
          attributes: ['dni', 'first_name', 'last_name', 'phone_number']
        }]
      },
      {
        model: Vehicles,
        as: 'vehicle',
        required: false,
        attributes: ['plate_number', 'brand', 'model', 'manufacturing_year']
      },
      {
        model: ControlRecords,
        as: 'controlRecord',
        attributes: ['seatbelt', 'cleanliness', 'tires', 'first_aid_kit', 'fire_extinguisher', 'lights']
      },
      {
        model: Photos,
        as: 'photos',
        required: false,
        attributes: ['id', 'url', 'coordinates', 'capture_date'],
        through: { attributes: [] }
      }
    ];

    // Primero obtener totales para el summary (sin paginación)
    let totalCompliant = 0;
    let totalNonCompliant = 0;

    if (recordType === 'all' || recordType === 'conforme') {
      totalCompliant = await CompliantRecords.count({ where: searchConditions });
    }

    if (recordType === 'all' || recordType === 'noconforme') {
      totalNonCompliant = await NonCompliantRecords.count({ where: searchConditions });
    }

    const totalRecords = totalCompliant + totalNonCompliant;

    // Ahora obtener los datos paginados
    let allRecords = [];

    if (recordType === 'conforme') {
      // Solo actas conformes
      const compliantResult = await CompliantRecords.findAll({
        where: searchConditions,
        attributes: [
          'id', 'inspector_id', 'license_id', 'vehicle_plate', 
          'inspection_date_time', 'location', 'observations', 'createdAt', 'updatedAt'
        ],
        include: commonIncludes,
        order: [[sortBy, sortOrder]],
        limit: limit,
        offset: offset
      });

      allRecords = compliantResult.map(record => ({
        ...record.toJSON(),
        recordType: 'conforme'
      }));

    } else if (recordType === 'noconforme') {
      // Solo actas no conformes
      const nonCompliantIncludes = [
        ...commonIncludes,
        {
          model: Companies,
          as: 'company',
          required: false,
          attributes: ['ruc', 'name', 'address']
        },
        {
          model: Violations,
          as: 'violations',
          required: false,
          attributes: ['id', 'code', 'description', 'severity', 'uit_percentage'],
          through: { attributes: [] }
        }
      ];

      const nonCompliantResult = await NonCompliantRecords.findAll({
        where: searchConditions,
        attributes: [
          'id', 'inspector_id', 'company_ruc', 'license_id', 'vehicle_plate',
          'inspection_date_time', 'location', 'observations', 'createdAt', 'updatedAt'
        ],
        include: nonCompliantIncludes,
        order: [[sortBy, sortOrder]],
        limit: limit,
        offset: offset
      });

      allRecords = nonCompliantResult.map(record => ({
        ...record.toJSON(),
        recordType: 'noconforme'
      }));

    } else {
      // Ambos tipos - necesitamos una estrategia diferente
      // Obtener ambos tipos y luego ordenar y paginar manualmente
      
      const compliantRecords = await CompliantRecords.findAll({
        where: searchConditions,
        attributes: [
          'id', 'inspector_id', 'license_id', 'vehicle_plate', 
          'inspection_date_time', 'location', 'observations', 'createdAt', 'updatedAt'
        ],
        include: commonIncludes
      });

      const nonCompliantIncludes = [
        ...commonIncludes,
        {
          model: Companies,
          as: 'company',
          required: false,
          attributes: ['ruc', 'name', 'address']
        },
        {
          model: Violations,
          as: 'violations',
          required: false,
          attributes: ['id', 'code', 'description', 'severity', 'uit_percentage'],
          through: { attributes: [] }
        }
      ];

      const nonCompliantRecords = await NonCompliantRecords.findAll({
        where: searchConditions,
        attributes: [
          'id', 'inspector_id', 'company_ruc', 'license_id', 'vehicle_plate',
          'inspection_date_time', 'location', 'observations', 'createdAt', 'updatedAt'
        ],
        include: nonCompliantIncludes
      });

      // Combinar ambos tipos
      const combinedRecords = [
        ...compliantRecords.map(record => ({
          ...record.toJSON(),
          recordType: 'conforme'
        })),
        ...nonCompliantRecords.map(record => ({
          ...record.toJSON(),
          recordType: 'noconforme'
        }))
      ];

      // Ordenar manualmente
      combinedRecords.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortOrder === 'DESC') {
          if (sortBy === 'createdAt' || sortBy === 'inspection_date_time') {
            return new Date(bValue) - new Date(aValue);
          }
          return bValue > aValue ? 1 : -1;
        } else {
          if (sortBy === 'createdAt' || sortBy === 'inspection_date_time') {
            return new Date(aValue) - new Date(bValue);
          }
          return aValue > bValue ? 1 : -1;
        }
      });

      // Aplicar paginación manual
      allRecords = combinedRecords.slice(offset, offset + limit);
    }

    // Formatear la respuesta
    const formattedRecords = allRecords.map(record => ({
      id: record.id,
      recordType: record.recordType,
      vehiclePlate: record.vehicle_plate,
      location: record.location,
      observations: record.observations,
      inspectionDateTime: record.inspection_date_time,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      inspector: {
        id: record.inspector?.id,
        username: record.inspector?.username,
        email: record.inspector?.email
      },
      driver: record.license?.driver ? {
        name: `${record.license.driver.first_name} ${record.license.driver.last_name}`,
        dni: record.license.driver.dni,
        phone: record.license.driver.phone_number,
        licenseNumber: record.license.licenseNumber,
        category: record.license.category
      } : null,
      vehicle: record.vehicle ? {
        plateNumber: record.vehicle.plate_number,
        brand: record.vehicle.brand,
        model: record.vehicle.model,
        year: record.vehicle.manufacturing_year
      } : null,
      company: record.company ? {
        ruc: record.company.ruc,
        name: record.company.name,
        address: record.company.address
      } : null,
      checklist: record.controlRecord ? {
        seatbelt: record.controlRecord.seatbelt,
        cleanliness: record.controlRecord.cleanliness,
        tires: record.controlRecord.tires,
        firstAidKit: record.controlRecord.first_aid_kit,
        fireExtinguisher: record.controlRecord.fire_extinguisher,
        lights: record.controlRecord.lights
      } : null,
      photosCount: record.photos ? record.photos.length : 0,
      violations: record.violations || [],
      violationsCount: record.violations ? record.violations.length : 0
    }));

    // Calcular total de páginas basado en el tipo de filtro
    let filteredTotal = totalRecords;
    if (recordType === 'conforme') {
      filteredTotal = totalCompliant;
    } else if (recordType === 'noconforme') {
      filteredTotal = totalNonCompliant;
    }

    const totalPages = Math.ceil(filteredTotal / limit);

    res.status(200).json({
      success: true,
      total: filteredTotal,
      pages: totalPages,
      currentPage: page,
      filters: {
        search,
        recordType,
        sortBy,
        sortOrder
      },
      summary: {
        totalCompliant,
        totalNonCompliant,
        totalRecords
      },
      data: formattedRecords
    });

  } catch (error) {
    console.error("Error en getAllRecords:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las actas",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener detalle completo de un acta (conforme o no conforme)
export const getRecordDetail = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { type } = req.query; // 'conforme' o 'noconforme'

    if (!type || !['conforme', 'noconforme'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de acta requerido (conforme o noconforme)"
      });
    }

    let record = null;

    if (type === 'conforme') {
      record = await CompliantRecords.findOne({
        where: { id: recordId },
        attributes: [
          'id', 'inspector_id', 'license_id', 'vehicle_plate',
          'inspection_date_time', 'location', 'observations', 'createdAt', 'updatedAt'
        ],
        include: [
          {
            model: User,
            as: 'inspector',
            attributes: ['id', 'username', 'email']
          },
          {
            model: DrivingLicenses,
            as: 'license',
            required: false,
            attributes: ['licenseId', 'licenseNumber', 'category'],
            include: [{
              model: Drivers,
              as: 'driver',
              required: false,
              attributes: ['dni', 'first_name', 'last_name', 'phone_number', 'address']
            }]
          },
          {
            model: Vehicles,
            as: 'vehicle',
            required: false,
            attributes: ['plate_number', 'brand', 'model', 'manufacturing_year']
          },
          {
            model: ControlRecords,
            as: 'controlRecord',
            attributes: ['id', 'seatbelt', 'cleanliness', 'tires', 'first_aid_kit', 'fire_extinguisher', 'lights']
          },
          {
            model: Photos,
            as: 'photos',
            required: false,
            attributes: ['id', 'url', 'coordinates', 'capture_date'],
            through: { attributes: [] }
          }
        ]
      });
    } else {
      record = await NonCompliantRecords.findOne({
        where: { id: recordId },
        attributes: [
          'id', 'inspector_id', 'company_ruc', 'license_id', 'vehicle_plate',
          'inspection_date_time', 'location', 'observations', 'createdAt', 'updatedAt'
        ],
        include: [
          {
            model: User,
            as: 'inspector',
            attributes: ['id', 'username', 'email']
          },
          {
            model: Companies,
            as: 'company',
            required: false,
            attributes: ['ruc', 'name', 'address']
          },
          {
            model: DrivingLicenses,
            as: 'license',
            required: false,
            attributes: ['licenseId', 'licenseNumber', 'category'],
            include: [{
              model: Drivers,
              as: 'driver',
              required: false,
              attributes: ['dni', 'first_name', 'last_name', 'phone_number', 'address']
            }]
          },
          {
            model: Vehicles,
            as: 'vehicle',
            required: false,
            attributes: ['plate_number', 'brand', 'model', 'manufacturing_year']
          },
          {
            model: ControlRecords,
            as: 'controlRecord',
            attributes: ['id', 'seatbelt', 'cleanliness', 'tires', 'first_aid_kit', 'fire_extinguisher', 'lights']
          },
          {
            model: Photos,
            as: 'photos',
            required: false,
            attributes: ['id', 'url', 'coordinates', 'capture_date'],
            through: { attributes: [] }
          },
          {
            model: Violations,
            as: 'violations',
            required: false,
            attributes: ['id', 'code', 'description', 'severity', 'uit_percentage', 'administrative_measure', 'target'],
            through: { attributes: [] }
          }
        ]
      });
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `Acta ${type} no encontrada`
      });
    }

    // Formatear respuesta detallada
    const detailedRecord = {
      id: record.id,
      recordType: type,
      vehiclePlate: record.vehicle_plate,
      location: record.location,
      observations: record.observations,
      inspectionDateTime: record.inspection_date_time,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      inspector: {
        id: record.inspector.id,
        username: record.inspector.username,
        email: record.inspector.email
      },
      driver: record.license?.driver ? {
        name: `${record.license.driver.first_name} ${record.license.driver.last_name}`,
        dni: record.license.driver.dni,
        phone: record.license.driver.phone_number,
        address: record.license.driver.address,
        licenseNumber: record.license.licenseNumber,
        category: record.license.category
      } : null,
      vehicle: record.vehicle ? {
        plateNumber: record.vehicle.plate_number,
        brand: record.vehicle.brand,
        model: record.vehicle.model,
        year: record.vehicle.manufacturing_year
      } : null,
      company: record.company ? {
        ruc: record.company.ruc,
        name: record.company.name,
        address: record.company.address
      } : null,
      checklist: {
        id: record.controlRecord.id,
        seatbelt: record.controlRecord.seatbelt,
        cleanliness: record.controlRecord.cleanliness,
        tires: record.controlRecord.tires,
        firstAidKit: record.controlRecord.first_aid_kit,
        fireExtinguisher: record.controlRecord.fire_extinguisher,
        lights: record.controlRecord.lights
      },
      photos: record.photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        coordinates: photo.coordinates,
        captureDate: photo.capture_date
      })),
      photosCount: record.photos.length,
      violations: record.violations ? record.violations.map(violation => ({
        id: violation.id,
        code: violation.code,
        description: violation.description,
        severity: violation.severity,
        uitPercentage: violation.uit_percentage,
        administrativeMeasure: violation.administrative_measure,
        target: violation.target
      })) : [],
      violationsCount: record.violations ? record.violations.length : 0
    };

    res.status(200).json({
      success: true,
      data: detailedRecord
    });

  } catch (error) {
    console.error("Error en getRecordDetail:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el detalle del acta",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};