import db from "../models/index.js";

const {
  compliantRecord:CompliantRecords,
  nonCompliantRecord:NonCompliantRecords,
  controlRecord:ControlRecords,
  drivingLicense:DrivingLicenses,
  driver:Drivers,
  user:User
} = db;
// Obtener actas conforme por usuario fiscalizador (paginado) - CORREGIDO
export const getConformeByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    const records = await CompliantRecords.findAndCountAll({
      where: { inspectorId: id }, // Cambiado de inspector_id
      attributes: ['id', 'vehiclePlate', 'createdAt'], // Cambiado vehicle_plate
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Formatear la respuesta para mantener compatibilidad con el frontend
    const formattedRows = records.rows.map(record => ({
      id: record.id,
      vehicle_plate: record.vehiclePlate, // Convertir de vuelta al formato esperado
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

// Obtener actas no conforme por usuario fiscalizador (paginado) - CORREGIDO
export const getNoConformeByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    const records = await NonCompliantRecords.findAndCountAll({
      where: { inspectorId: id }, // Cambiado de inspector_id
      attributes: ['id', 'vehiclePlate', 'createdAt'], // Cambiado vehicle_plate
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Formatear la respuesta para mantener compatibilidad con el frontend
    const formattedRows = records.rows.map(record => ({
      id: record.id,
      vehicle_plate: record.vehiclePlate, // Convertir de vuelta al formato esperado
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

// Obtener detalle de un acta conforme
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
          attributes: ['licenseNumber'], // Cambiado de 'license_number'
          include: [{
            model: Drivers,
            as: 'driver',
            attributes: ['firstName', 'lastName'] // Cambiado de 'first_name', 'last_name'
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

    // Formatear la respuesta
    const response = {
      id: record.id,
      vehicle_plate: record.vehiclePlate, // Usando el nombre correcto de la columna
      location: record.location,
      license_number: record.license?.licenseNumber || null, // Usando optional chaining
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

// Obtener detalle de un acta conforme
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
          attributes: ['licenseNumber'], // Cambiado de 'license_number'
          include: [{
            model: Drivers,
            as: 'driver',
            attributes: ['firstName', 'lastName'] // Cambiado de 'first_name', 'last_name'
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

    // Formatear la respuesta
    const response = {
      id: record.id,
      vehicle_plate: record.vehiclePlate, // Usando el nombre correcto de la columna
      location: record.location,
      license_number: record.license?.licenseNumber || null, // Usando optional chaining
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