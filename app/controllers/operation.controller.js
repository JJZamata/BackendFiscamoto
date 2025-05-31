import db from "../models/index.js";
import { QueryTypes } from "sequelize";
import { 
  calculateDocumentStatus,
  normalizeDates
} from "../utils/documentUtils.js";
import {
  DRIVER_QUERY,
  VEHICLE_QUERY,
  INSURANCE_QUERY,
  TECH_REVIEW_QUERY
} from "../utils/queries.js";

// Función compartida para obtener información del conductor
const fetchDriverInfo = async (dni) => {
  const driverData = await db.sequelize.query(DRIVER_QUERY, {
    replacements: { dni },
    type: QueryTypes.SELECT
  });

  if (!driverData || driverData.length === 0) return null;
  
  const driver = normalizeDates(driverData[0]);
  const licenseStatus = calculateDocumentStatus(driver.fecha_vencimiento_licencia);
  
  return {
    data: driver,
    estados: { licencia: licenseStatus }
  };
};

// Función compartida para obtener información del vehículo
const fetchVehicleInfo = async (plateNumber) => {
  const [vehicleData, insuranceData, techReviewData] = await Promise.all([
    db.sequelize.query(VEHICLE_QUERY, {
      replacements: { plateNumber },
      type: QueryTypes.SELECT
    }),
    db.sequelize.query(INSURANCE_QUERY, {
      replacements: { plateNumber },
      type: QueryTypes.SELECT
    }),
    db.sequelize.query(TECH_REVIEW_QUERY, {
      replacements: { plateNumber },
      type: QueryTypes.SELECT
    })
  ]);

  if (!vehicleData || vehicleData.length === 0) return null;

  const vehicle = normalizeDates(vehicleData[0]);
  const insurance = insuranceData[0] ? normalizeDates(insuranceData[0]) : null;
  const techReview = techReviewData[0] ? normalizeDates(techReviewData[0]) : null;

  return {
    data: {
      vehiculo: vehicle,
      seguro_afocat: insurance,
      revision_tecnica: techReview
    },
    estados: {
      revision_tecnica: calculateDocumentStatus(techReview?.fecha_vencimiento),
      afocat: calculateDocumentStatus(insurance?.fecha_vencimiento),
      ruc_empresa: calculateDocumentStatus(vehicle.fecha_vencimiento_ruc),
      propietario: vehicle.owner_dni ? 'vigente' : 'no_tiene'
    }
  };
};

// Controladores refactorizados
export const getDriverInfo = async (req, res) => {
  try {
    const { id: dni } = req.params;
    if (!dni) {
      return res.status(400).json({ 
        success: false, 
        message: "DNI del conductor es requerido" 
      });
    }

    const driverInfo = await fetchDriverInfo(dni);
    if (!driverInfo) {
      return res.status(404).json({ 
        success: false, 
        message: "Conductor no encontrado" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: driverInfo 
    });
  } catch (error) {
    console.error("Error en getDriverInfo:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener información del conductor" 
    });
  }
};

export const getVehicleInfo = async (req, res) => {
  try {
    const { id: plateNumber } = req.params;
    if (!plateNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "Placa del vehículo es requerida" 
      });
    }

    const vehicleInfo = await fetchVehicleInfo(plateNumber);
    if (!vehicleInfo) {
      return res.status(404).json({ 
        success: false, 
        message: "Vehículo no encontrado" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: vehicleInfo 
    });
  } catch (error) {
    console.error("Error en getVehicleInfo:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener información del vehículo" 
    });
  }
};

//tal vez innecesario, pero lo dejo por si acaso
// Controlador para obtener información combinada de operación
export const getOperationInfo = async (req, res) => {
  try {
    const { dni, plateNumber } = req.body;
    if (!dni && !plateNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "Se requiere al menos DNI del conductor o placa del vehículo" 
      });
    }

    const results = {};
    
    if (dni) {
      results.conductor = await fetchDriverInfo(dni);
    }
    
    if (plateNumber) {
      results.vehiculo = await fetchVehicleInfo(plateNumber);
    }

    res.status(200).json({ 
      success: true, 
      data: results 
    });
  } catch (error) {
    console.error("Error en getOperationInfo:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener información de la operación" 
    });
  }
};