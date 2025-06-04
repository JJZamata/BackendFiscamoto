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
      location
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

    // PASO 2: Crear las fotos y relacionarlas con el control record
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

        // Crear la relación control_record -> photo
        await RecordPhotos.create({
          controlRecordId: controlRecord.id,
          photoId: photo.id
        }, { transaction });

        console.log(`Foto ${photo.id} creada y relacionada`);
      }
    }

    // PASO 3: Crear el compliant record
    console.log("Creando compliant record...");
    const compliantRecord = await CompliantRecords.create({
      controlRecordId: controlRecord.id,
      inspectorId: inspectorId,
      licenseId: licenseId || null,
      vehiclePlate: vehiclePlate,
      inspectionDateTime: inspection_date_time || new Date(),
      location: location || null
    }, { transaction });

    console.log("Compliant record creado:", compliantRecord.id);

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