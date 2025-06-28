//controller/production.controller.js
import db from "../models/index.js";

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
  sequelize
} = db;

// Crear acta conforme con checklist y fotos (transaccional)
export const createCompliantRecord = async (req, res) => {
  // Iniciar transacción
  const transaction = await sequelize.transaction();
  
  try {
    const {
      seatbelt,
      cleanliness,
      tires,
      firstAidKit,
      fireExtinguisher,
      lights,
      photos = [],
      licenseId,
      vehiclePlate,
      inspection_date_time,
      location,
      observations
    } = req.body;

    // Obtener inspector ID del token JWT (asumiendo que está en req.userId)
    const inspectorId = req.userId;

    // Validaciones básicas
    if (!inspectorId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Inspector ID requerido"
      });
    }

    if (!vehiclePlate) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Placa del vehículo requerida"
      });
    }

    // Validar que el vehículo existe
    const vehicleExists = await Vehicles.findOne({
      where: { plateNumber: vehiclePlate }
    });

    if (!vehicleExists) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado"
      });
    }

    // Validar licencia si se proporciona
    if (licenseId) {
      const licenseExists = await DrivingLicenses.findByPk(licenseId);
      if (!licenseExists) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Licencia de conducir no encontrada"
        });
      }
    }

    // PASO 1: Crear el control record (checklist)
    console.log("Creando control record...");
    const controlRecord = await ControlRecords.create({
      seatbelt: seatbelt || false,
      cleanliness: cleanliness || false,
      tires: tires || false,
      firstAidKit: firstAidKit || false,
      fireExtinguisher: fireExtinguisher || false,
      lights: lights || false
    }, { transaction });

    console.log("Control record creado:", controlRecord.id);

    // PASO 2: Crear el compliant record
    console.log("Creando compliant record...");
    const compliantRecord = await CompliantRecords.create({
      controlRecordId: controlRecord.id,
      inspectorId: inspectorId,
      licenseId: licenseId || null,
      vehiclePlate: vehiclePlate,
      inspectionDateTime: inspection_date_time || new Date(),
      location: location || null,
      observations: observations || null
    }, { transaction });

    console.log("Compliant record creado:", compliantRecord.id);

    // PASO 3: Crear las fotos y relacionarlas con el compliant record
    const createdPhotos = [];
    
    if (photos && photos.length > 0) {
      console.log(`Procesando ${photos.length} fotos...`);
      
      for (const photoData of photos) {
        // Crear la foto
        const photo = await Photos.create({
          userId: inspectorId,
          coordinates: photoData.coordinates || null,
          url: photoData.url,
          captureDate: photoData.capture_date || new Date()
        }, { transaction });

        createdPhotos.push(photo);

        // CAMBIO PRINCIPAL: Crear la relación compliant_record -> photo
        // Usar compliantRecordId en lugar de controlRecordId
        await RecordPhotos.create({
          compliantRecordId: compliantRecord.id,  // ✅ Campo actualizado
          nonCompliantRecordId: null,             // ✅ Explícitamente null
          photoId: photo.id
        }, { transaction });

        console.log(`Foto ${photo.id} creada y relacionada con compliant record ${compliantRecord.id}`);
      }
    }

    // Confirmar la transacción
    await transaction.commit();

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: "Acta conforme registrada exitosamente",
      data: {
        compliantRecordId: compliantRecord.id,
        controlRecordId: controlRecord.id,
        vehiclePlate: vehiclePlate,
        location: location,
        observations: observations,
        photosCount: createdPhotos.length,
        inspectionDateTime: compliantRecord.inspectionDateTime,
        checklist: {
          seatbelt,
          cleanliness,
          tires,
          firstAidKit,
          fireExtinguisher,
          lights
        }
      }
    });

  } catch (error) {
    // Rollback en caso de error
    await transaction.rollback();
    
    console.error("Error en createCompliantRecord:", error);
    
    // Manejo de errores específicos de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Error de validación en los datos",
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: "Error de referencia: datos relacionados no encontrados"
      });
    }

    // Error genérico
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al registrar el acta conforme",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Crear acta no conforme con checklist, fotos e infracciones (transaccional)
export const createNonCompliantRecord = async (req, res) => {
  // Iniciar transacción
  const transaction = await sequelize.transaction();
  
  try {
    const {
      seatbelt,
      cleanliness,
      tires,
      firstAidKit,
      fireExtinguisher,
      lights,
      photos = [],
      violations = [], // Array de IDs de infracciones
      companyRuc,
      licenseId,
      vehiclePlate,
      inspection_date_time,
      location,
      observations
    } = req.body;

    // Obtener inspector ID del token JWT (asumiendo que está en req.userId)
    const inspectorId = req.userId;

    // Validaciones básicas
    if (!inspectorId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Inspector ID requerido"
      });
    }

    if (!vehiclePlate) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Placa del vehículo requerida"
      });
    }

    if (!companyRuc) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "RUC de la empresa requerido"
      });
    }

    if (!violations || violations.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Al menos una infracción es requerida para un acta no conforme"
      });
    }

    // Validar que el vehículo existe
    const vehicleExists = await Vehicles.findOne({
      where: { plateNumber: vehiclePlate }
    });

    if (!vehicleExists) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Vehículo no encontrado"
      });
    }

    // Validar que la empresa existe
    const companyExists = await db.company.findOne({
      where: { ruc: companyRuc }
    });

    if (!companyExists) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Empresa no encontrada"
      });
    }

    // Validar licencia si se proporciona
    if (licenseId) {
      const licenseExists = await DrivingLicenses.findByPk(licenseId);
      if (!licenseExists) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Licencia de conducir no encontrada"
        });
      }
    }

    // Validar que todas las infracciones existen
    const existingViolations = await db.violation.findAll({
      where: {
        id: violations
      }
    });

    if (existingViolations.length !== violations.length) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Una o más infracciones no encontradas"
      });
    }

    // PASO 1: Crear el control record (checklist)
    console.log("Creando control record...");
    const controlRecord = await ControlRecords.create({
      seatbelt: seatbelt || false,
      cleanliness: cleanliness || false,
      tires: tires || false,
      firstAidKit: firstAidKit || false,
      fireExtinguisher: fireExtinguisher || false,
      lights: lights || false
    }, { transaction });

    console.log("Control record creado:", controlRecord.id);

    // PASO 2: Crear el non-compliant record
    console.log("Creando non-compliant record...");
    const nonCompliantRecord = await NonCompliantRecords.create({
      controlRecordId: controlRecord.id,
      inspectorId: inspectorId,
      companyRuc: companyRuc,
      licenseId: licenseId || null,
      vehiclePlate: vehiclePlate,
      inspectionDateTime: inspection_date_time || new Date(),
      location: location || null,
      observations: observations || null
    }, { transaction });

    console.log("Non-compliant record creado:", nonCompliantRecord.id);

    // PASO 3: Crear las relaciones con infracciones
    console.log(`Procesando ${violations.length} infracciones...`);
    for (const violationId of violations) {
      await db.recordViolation.create({
        nonCompliantRecordId: nonCompliantRecord.id,
        violationId: violationId
      }, { transaction });

      console.log(`Infracción ${violationId} relacionada con non-compliant record ${nonCompliantRecord.id}`);
    }

    // PASO 4: Crear las fotos y relacionarlas con el non-compliant record
    const createdPhotos = [];
    
    if (photos && photos.length > 0) {
      console.log(`Procesando ${photos.length} fotos...`);
      
      for (const photoData of photos) {
        // Crear la foto
        const photo = await Photos.create({
          userId: inspectorId,
          coordinates: photoData.coordinates || null,
          url: photoData.url,
          captureDate: photoData.capture_date || new Date()
        }, { transaction });

        createdPhotos.push(photo);

        // Crear la relación non_compliant_record -> photo
        await RecordPhotos.create({
          compliantRecordId: null,                // Explícitamente null
          nonCompliantRecordId: nonCompliantRecord.id, // Campo específico para actas no conformes
          photoId: photo.id
        }, { transaction });

        console.log(`Foto ${photo.id} creada y relacionada con non-compliant record ${nonCompliantRecord.id}`);
      }
    }

    // Confirmar la transacción
    await transaction.commit();

    // Obtener detalles de las infracciones para la respuesta
    const violationDetails = existingViolations.map(violation => ({
      id: violation.id,
      code: violation.code,
      description: violation.description,
      severity: violation.severity,
      severityLabel: violation.severityLabel,
      uitPercentage: violation.uitPercentage,
      administrativeMeasure: violation.administrativeMeasure,
      target: violation.target
    }));

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: "Acta no conforme registrada exitosamente",
      data: {
        nonCompliantRecordId: nonCompliantRecord.id,
        controlRecordId: controlRecord.id,
        vehiclePlate: vehiclePlate,
        companyRuc: companyRuc,
        location: location,
        observations: observations,
        photosCount: createdPhotos.length,
        violationsCount: violations.length,
        inspectionDateTime: nonCompliantRecord.inspectionDateTime,
        checklist: {
          seatbelt,
          cleanliness,
          tires,
          firstAidKit,
          fireExtinguisher,
          lights
        },
        violations: violationDetails
      }
    });

  } catch (error) {
    // Rollback en caso de error
    await transaction.rollback();
    
    console.error("Error en createNonCompliantRecord:", error);
    
    // Manejo de errores específicos de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Error de validación en los datos",
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: "Error de referencia: datos relacionados no encontrados"
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: "Error de duplicación: relación ya existe"
      });
    }

    // Error genérico
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al registrar el acta no conforme",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener actas conforme por usuario fiscalizador (paginado) - EXISTENTE
export const getConformeByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    const records = await CompliantRecords.findAndCountAll({
      where: { inspectorId: id },
      attributes: ['id', 'vehiclePlate', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const formattedRows = records.rows.map(record => ({
      id: record.id,
      vehicle_plate: record.vehiclePlate,
      createdAt: record.createdAt
    }));

    res.status(200).json({
      success: true,
      total: records.count,
      pages: Math.ceil(records.count / limit),
      currentPage: page,
      data: formattedRows
    });
  } catch (error) {
    console.error("Error en getConformeByUser:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las actas conforme del usuario"
    });
  }
};

// Obtener actas no conforme por usuario fiscalizador (paginado) - EXISTENTE
export const getNoConformeByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    const records = await NonCompliantRecords.findAndCountAll({
      where: { inspectorId: id },
      attributes: ['id', 'vehiclePlate', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const formattedRows = records.rows.map(record => ({
      id: record.id,
      vehicle_plate: record.vehiclePlate,
      createdAt: record.createdAt
    }));

    res.status(200).json({
      success: true,
      total: records.count,
      pages: Math.ceil(records.count / limit),
      currentPage: page,
      data: formattedRows
    });
  } catch (error) {
    console.error("Error en getNoConformeByUser:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las actas no conforme del usuario"
    });
  }
};

// Obtener detalle de un acta conforme - EXISTENTE
export const getConformeDetail = async (req, res) => {
  try {
    const { actaId } = req.params;

    const record = await CompliantRecords.findOne({
      where: { id: actaId },
      attributes: ['id', 'vehiclePlate', 'location', 'licenseId', 'createdAt'],
      include: [
        {
          model: DrivingLicenses,
          as: 'license',
          attributes: ['licenseNumber'],
          include: [{
            model: Drivers,
            as: 'driver',
            attributes: ['firstName', 'lastName']
          }]
        }
      ]
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Acta conforme no encontrada"
      });
    }

    const response = {
      id: record.id,
      vehicle_plate: record.vehiclePlate,
      location: record.location,
      license_number: record.license?.licenseNumber || null,
      driver_name: record.license?.driver ? 
        `${record.license.driver.firstName} ${record.license.driver.lastName}` : 
        null,
      createdAt: record.createdAt
    };

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error("Error en getConformeDetail:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el detalle del acta conforme"
    });
  }
};

// Obtener detalle de un acta no conforme - EXISTENTE
export const getNoConformeDetail = async (req, res) => {
  try {
    const { actaId } = req.params;

    const record = await NonCompliantRecords.findOne({
      where: { id: actaId },
      attributes: ['id', 'vehiclePlate', 'location', 'licenseId', 'createdAt'],
      include: [
        {
          model: DrivingLicenses,
          as: 'license',
          attributes: ['licenseNumber'],
          include: [{
            model: Drivers,
            as: 'driver',
            attributes: ['firstName', 'lastName']
          }]
        }
      ]
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Acta no conforme no encontrada"
      });
    }

    const response = {
      id: record.id,
      vehicle_plate: record.vehiclePlate,
      location: record.location,
      license_number: record.license?.licenseNumber || null,
      driver_name: record.license?.driver ? 
        `${record.license.driver.firstName} ${record.license.driver.lastName}` : 
        null,
      createdAt: record.createdAt
    };

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error("Error en getNoConformeDetail:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el detalle del acta no conforme"
    });
  }
};

export const updateCompliantRecordS3Url = async (req, res) => {
  try {
    const { actaId } = req.params;
    const { s3FileUrl } = req.body;

    // Validaciones básicas
    if (!s3FileUrl) {
      return res.status(400).json({
        success: false,
        message: "URL del archivo S3 es requerida"
      });
    }
/*
    // Validar formato de URL básico
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(s3FileUrl)) {
      return res.status(400).json({
        success: false,
        message: "Debe ser una URL válida"
      });
    }
*/
    // Buscar el acta conforme
    const compliantRecord = await CompliantRecords.findByPk(actaId);

    if (!compliantRecord) {
      return res.status(404).json({
        success: false,
        message: "Acta conforme no encontrada"
      });
    }

    // Actualizar el campo s3FileUrl
    await compliantRecord.update({
      s3FileUrl: s3FileUrl
    });

    console.log(`S3 URL actualizada para acta conforme ${actaId}: ${s3FileUrl}`);

    res.status(200).json({
      success: true,
      message: "URL del archivo S3 actualizada exitosamente",
      data: {
        actaId: compliantRecord.id,
        s3FileUrl: compliantRecord.s3FileUrl,
        updatedAt: compliantRecord.updatedAt
      }
    });

  } catch (error) {
    console.error("Error en updateCompliantRecordS3Url:", error);
    
    // Manejo de errores específicos de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Error de validación en los datos",
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al actualizar la URL del archivo S3",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar S3 File URL para acta no conforme
export const updateNonCompliantRecordS3Url = async (req, res) => {
  try {
    const { actaId } = req.params;
    const { s3FileUrl } = req.body;

    // Validaciones básicas
    if (!s3FileUrl) {
      return res.status(400).json({
        success: false,
        message: "URL del archivo S3 es requerida"
      });
    }
/*
    // Validar formato de URL básico
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(s3FileUrl)) {
      return res.status(400).json({
        success: false,
        message: "Debe ser una URL válida"
      });
    }
*/
    // Buscar el acta no conforme
    const nonCompliantRecord = await NonCompliantRecords.findByPk(actaId);

    if (!nonCompliantRecord) {
      return res.status(404).json({
        success: false,
        message: "Acta no conforme no encontrada"
      });
    }

    // Actualizar el campo s3FileUrl
    await nonCompliantRecord.update({
      s3FileUrl: s3FileUrl
    });

    console.log(`S3 URL actualizada para acta no conforme ${actaId}: ${s3FileUrl}`);

    res.status(200).json({
      success: true,
      message: "URL del archivo S3 actualizada exitosamente",
      data: {
        actaId: nonCompliantRecord.id,
        s3FileUrl: nonCompliantRecord.s3FileUrl,
        updatedAt: nonCompliantRecord.updatedAt
      }
    });

  } catch (error) {
    console.error("Error en updateNonCompliantRecordS3Url:", error);
    
    // Manejo de errores específicos de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Error de validación en los datos",
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al actualizar la URL del archivo S3",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
