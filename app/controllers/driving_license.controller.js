//driving_license.controller.js
import db from "../models/index.js";
const { drivingLicense: DrivingLicense, driver: Driver } = db;
// Crear nueva licencia de conducir
export const createDrivingLicense = async (req, res) => {
  try {
    const {
      driverDni,
      licenseNumber,
      category,
      issueDate,
      expirationDate,
      issuingEntity,
      restrictions = 'SIN RESTRICCIONES'
    } = req.body;

    // Validaciones básicas - removido licenseId de los campos requeridos
    if (!driverDni || !licenseNumber || !category || !issueDate || !expirationDate || !issuingEntity) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos obligatorios deben ser proporcionados",
        requiredFields: ["driverDni", "licenseNumber", "category", "issueDate", "expirationDate", "issuingEntity"]
      });
    }

    // Validar formato DNI
    if (!/^\d{8}$/.test(driverDni)) {
      return res.status(400).json({
        success: false,
        message: "El DNI debe tener exactamente 8 dígitos numéricos",
        field: "driverDni"
      });
    }

    // Validar formato de número de licencia
    if (!/^[A-Z0-9]{5,15}$/.test(licenseNumber)) {
      return res.status(400).json({
        success: false,
        message: "El número de licencia debe tener entre 5 y 15 caracteres alfanuméricos",
        field: "licenseNumber"
      });
    }

    // Validar categorías permitidas
    const validCategories = ['A-I', 'A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc', 'B-I', 'B-IIa', 'B-IIb', 'B-IIc'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Categoría de licencia no válida",
        field: "category",
        validCategories: validCategories
      });
    }

    // Validar restricciones permitidas
    const validRestrictions = ['SIN RESTRICCIONES', 'LENTES CORRECTIVOS', 'APARATOS AUDITIVOS', 'PROTESIS EN MIEMBROS', 'OTRAS RESTRICCIONES'];
    if (!validRestrictions.includes(restrictions)) {
      return res.status(400).json({
        success: false,
        message: "Restricción no válida",
        field: "restrictions",
        validRestrictions: validRestrictions
      });
    }

    // Validar fechas
    const issueDateObj = new Date(issueDate);
    const expirationDateObj = new Date(expirationDate);
    const today = new Date();

    if (isNaN(issueDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Fecha de emisión no válida",
        field: "issueDate"
      });
    }

    if (isNaN(expirationDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Fecha de vencimiento no válida",
        field: "expirationDate"
      });
    }

    if (expirationDateObj <= issueDateObj) {
      return res.status(400).json({
        success: false,
        message: "La fecha de vencimiento debe ser posterior a la fecha de emisión",
        field: "expirationDate"
      });
    }

    // Validar que la fecha de emisión no sea futura
    if (issueDateObj > today) {
      return res.status(400).json({
        success: false,
        message: "La fecha de emisión no puede ser futura",
        field: "issueDate"
      });
    }

    // Validar entidad emisora
    if (issuingEntity.trim().length < 1 || issuingEntity.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "La entidad emisora debe tener entre 1 y 100 caracteres",
        field: "issuingEntity"
      });
    }

    // Verificar que el conductor existe
    const existingDriver = await Driver.findByPk(driverDni);
    if (!existingDriver) {
      return res.status(404).json({
        success: false,
        message: "No existe un conductor con el DNI proporcionado",
        field: "driverDni"
      });
    }

    // Verificar que no exista ya una licencia con el mismo número
    const existingLicenseByNumber = await DrivingLicense.findOne({
      where: { licenseNumber: licenseNumber.trim().toUpperCase() }
    });
    if (existingLicenseByNumber) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una licencia con este número",
        field: "licenseNumber"
      });
    }

    // Verificar si el conductor ya tiene una licencia vigente de la misma categoría
    const existingActiveLicense = await DrivingLicense.findOne({
      where: {
        driverDni: driverDni,
        category: category,
        expirationDate: {
          [db.Sequelize.Op.gte]: today
        }
      }
    });

    if (existingActiveLicense) {
      return res.status(409).json({
        success: false,
        message: "El conductor ya tiene una licencia vigente de esta categoría",
        field: "category",
        existingLicense: {
          licenseId: existingActiveLicense.licenseId,
          licenseNumber: existingActiveLicense.licenseNumber,
          expirationDate: existingActiveLicense.expirationDate
        }
      });
    }

    // Crear la licencia - removido licenseId del objeto, será generado automáticamente
    const newLicense = await DrivingLicense.create({
      driverDni: driverDni.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      category: category,
      issueDate: issueDate,
      expirationDate: expirationDate,
      issuingEntity: issuingEntity.trim(),
      restrictions: restrictions
    });

    // Calcular estado de la licencia
    const daysUntilExpiration = Math.ceil((expirationDateObj - today) / (1000 * 60 * 60 * 24));
    let licenseStatus = "vigente";
    
    if (daysUntilExpiration < 0) {
      licenseStatus = "vencida";
    } else if (daysUntilExpiration <= 30) {
      licenseStatus = "por_vencer";
    }

    res.status(201).json({
      success: true,
      message: "Licencia de conducir creada exitosamente",
      data: {
        licenseId: newLicense.licenseId, // Este valor será generado automáticamente
        driverDni: newLicense.driverDni,
        licenseNumber: newLicense.licenseNumber,
        category: newLicense.category,
        issueDate: newLicense.issueDate,
        expirationDate: newLicense.expirationDate,
        issuingEntity: newLicense.issuingEntity,
        restrictions: newLicense.restrictions,
        fechaCreacion: newLicense.createdAt,
        estado: licenseStatus,
        diasParaVencimiento: daysUntilExpiration > 0 ? daysUntilExpiration : 0,
        conductorInfo: {
          dni: existingDriver.dni,
          nombreCompleto: `${existingDriver.firstName} ${existingDriver.lastName}`
        }
      }
    });

  } catch (error) {
    console.error("Error en createDrivingLicense:", error);
    
    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const validationError = error.errors[0];
      return res.status(400).json({
        success: false,
        message: validationError.message,
        field: validationError.path
      });
    }

    // Manejar errores de clave única
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      let message = "Ya existe un registro con este valor";
      
      if (field === 'license_number') {
        message = "Ya existe una licencia con este número";
      }
      
      return res.status(409).json({
        success: false,
        message: message,
        field: field
      });
    }

    // Manejar errores de clave foránea
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: "El DNI del conductor no existe",
        field: "driverDni"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear la licencia de conducir"
    });
  }
};