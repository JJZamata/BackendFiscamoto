// middlewares/vehicleValidation.js
import { query, param, body, validationResult } from "express-validator";

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: "Errores de validación en los parámetros",
      errors: formattedErrors
    });
  }
  
  next();
};

// Validaciones para crear vehículo
export const validateCreateVehicle = [
  body('plateNumber')
    .notEmpty()
    .withMessage('El número de placa es requerido')
    .isLength({ min: 6, max: 10 })
    .withMessage('El número de placa debe tener entre 6 y 10 caracteres')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('El número de placa solo puede contener letras mayúsculas y números')
    .trim(),

  body('companyRuc')
    .notEmpty()
    .withMessage('El RUC de la empresa es requerido')
    .isLength({ min: 11, max: 11 })
    .withMessage('El RUC debe tener exactamente 11 dígitos')
    .isNumeric()
    .withMessage('El RUC debe contener solo números'),

  body('ownerDni')
    .notEmpty()
    .withMessage('El DNI del propietario es requerido')
    .isLength({ min: 8, max: 8 })
    .withMessage('El DNI debe tener exactamente 8 dígitos')
    .isNumeric()
    .withMessage('El DNI debe contener solo números'),

  body('typeId')
    .notEmpty()
    .withMessage('El tipo de vehículo es requerido')
    .isInt({ min: 1 })
    .withMessage('El tipo de vehículo debe ser un número entero positivo')
    .toInt(),

  body('vehicleStatus')
    .optional()
    .isIn(['OPERATIVO', 'REPARACIÓN', 'FUERA DE SERVICIO', 'INSPECCIÓN'])
    .withMessage('El estado debe ser: OPERATIVO, REPARACIÓN, FUERA DE SERVICIO o INSPECCIÓN'),

  body('brand')
    .notEmpty()
    .withMessage('La marca es requerida')
    .isLength({ min: 1, max: 50 })
    .withMessage('La marca debe tener entre 1 y 50 caracteres')
    .trim(),

  body('model')
    .notEmpty()
    .withMessage('El modelo es requerido')
    .isLength({ min: 1, max: 50 })
    .withMessage('El modelo debe tener entre 1 y 50 caracteres')
    .trim(),

  body('manufacturingYear')
    .notEmpty()
    .withMessage('El año de fabricación es requerido')
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage(`El año de fabricación debe estar entre 1990 y ${new Date().getFullYear() + 1}`)
    .toInt(),

  handleValidationErrors
];

// Validaciones para actualizar vehículo
export const validateUpdateVehicle = [
  body('companyRuc')
    .optional()
    .isLength({ min: 11, max: 11 })
    .withMessage('El RUC debe tener exactamente 11 dígitos')
    .isNumeric()
    .withMessage('El RUC debe contener solo números'),

  body('ownerDni')
    .optional()
    .isLength({ min: 8, max: 8 })
    .withMessage('El DNI debe tener exactamente 8 dígitos')
    .isNumeric()
    .withMessage('El DNI debe contener solo números'),

  body('typeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El tipo de vehículo debe ser un número entero positivo')
    .toInt(),

  body('vehicleStatus')
    .optional()
    .isIn(['OPERATIVO', 'REPARACIÓN', 'FUERA DE SERVICIO', 'INSPECCIÓN'])
    .withMessage('El estado debe ser: OPERATIVO, REPARACIÓN, FUERA DE SERVICIO o INSPECCIÓN'),

  body('brand')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('La marca debe tener entre 1 y 50 caracteres')
    .trim(),

  body('model')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('El modelo debe tener entre 1 y 50 caracteres')
    .trim(),

  body('manufacturingYear')
    .optional()
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage(`El año de fabricación debe estar entre 1990 y ${new Date().getFullYear() + 1}`)
    .toInt(),

  handleValidationErrors
];

// Validaciones para el listado de vehículos
export const validateVehicleQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('La página debe ser un número entero entre 1 y 10000')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entero entre 1 y 100')
    .toInt(),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El término de búsqueda debe tener entre 1 y 100 caracteres')
    .trim()
    .escape(),

  query('status')
    .optional()
    .isIn(['OPERATIVO', 'REPARACIÓN', 'FUERA DE SERVICIO', 'INSPECCIÓN'])
    .withMessage('El estado debe ser: OPERATIVO, REPARACIÓN, FUERA DE SERVICIO o INSPECCIÓN'),

  query('type')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El tipo debe ser un número entero positivo')
    .toInt(),

  query('sortBy')
    .optional()
    .isIn(['plateNumber', 'vehicleStatus', 'brand', 'model', 'manufacturingYear', 'companyRuc', 'ownerDni'])
    .withMessage('Solo se puede ordenar por: plateNumber, vehicleStatus, brand, model, manufacturingYear, companyRuc, ownerDni'),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('El orden debe ser ASC o DESC')
    .toUpperCase(),

  handleValidationErrors
];

// Validaciones para obtener vehículo por placa
export const validateVehicleByPlate = [
  param('plateNumber')
    .notEmpty()
    .withMessage('El número de placa es requerido')
    .isLength({ min: 6, max: 10 })
    .withMessage('El número de placa debe tener entre 6 y 10 caracteres')
    .matches(/^[A-Z0-9]+$/i)
    .withMessage('El número de placa solo puede contener letras y números')
    .trim()
    .toUpperCase(),

  handleValidationErrors
];

// Validaciones para estadísticas de vehículos
export const validateVehicleStatsQuery = [
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe tener formato ISO 8601 (YYYY-MM-DD)')
    .toDate(),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe tener formato ISO 8601 (YYYY-MM-DD)')
    .toDate()
    .custom((value, { req }) => {
      if (req.query.dateFrom && value < new Date(req.query.dateFrom)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      return true;
    }),

  query('groupBy')
    .optional()
    .isIn(['type', 'brand', 'year', 'status', 'all'])
    .withMessage('El agrupamiento debe ser: type, brand, year, status o all'),

  handleValidationErrors
];

// Middleware para sanitizar queries de vehículos
export const sanitizeVehicleQuery = (req, res, next) => {
  try {
    // Sanitizar y normalizar parámetros de búsqueda
    if (req.query.search) {
      req.query.search = req.query.search.trim().replace(/\s+/g, ' ');
    }

    // Normalizar status a mayúsculas
    if (req.query.status) {
      req.query.status = req.query.status.toUpperCase();
    }

    // Normalizar sortOrder a mayúsculas
    if (req.query.sortOrder) {
      req.query.sortOrder = req.query.sortOrder.toUpperCase();
    }

    // Normalizar groupBy a minúsculas
    if (req.query.groupBy) {
      req.query.groupBy = req.query.groupBy.toLowerCase();
    }

    // Establecer valores por defecto si no se proporcionan
    req.query.page = req.query.page || 1;
    req.query.limit = req.query.limit || 6;
    req.query.sortBy = req.query.sortBy || 'plateNumber';
    req.query.sortOrder = req.query.sortOrder || 'ASC';

    next();
  } catch (error) {
    console.error('Error en sanitizeVehicleQuery:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar los parámetros de consulta'
    });
  }
};

// Middleware para logging de queries de vehículos
export const logVehicleQuery = (req, res, next) => {
  try {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    
    // Log básico de la consulta
    console.log(`[${timestamp}] VEHICLE_QUERY - ${method} ${url} - IP: ${ip}`);
    
    // Log detallado en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('Query Parameters:', req.query);
      console.log('Body Parameters:', req.body);
      console.log('User Agent:', userAgent);
    }

    // Agregar información de auditoría al request
    req.auditInfo = {
      timestamp,
      method,
      url,
      ip,
      userAgent,
      userId: req.userId || null,
      userRole: req.userRole || null
    };

    next();
  } catch (error) {
    console.error('Error en logVehicleQuery:', error);
    // No interrumpir el flujo por un error de logging
    next();
  }
};

// Middleware para validar fechas en rangos razonables
export const validateDateRange = (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (fromDate < oneYearAgo || fromDate > oneYearFromNow) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe estar dentro del rango de un año atrás a un año adelante'
        });
      }
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      if (toDate < oneYearAgo || toDate > oneYearFromNow) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe estar dentro del rango de un año atrás a un año adelante'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error en validateDateRange:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar el rango de fechas'
    });
  }
};

// Middleware para limitar consultas complejas
export const limitComplexQueries = (req, res, next) => {
  try {
    const { search, status, type, dateFrom, dateTo } = req.query;
    let complexityScore = 0;

    // Incrementar score por cada filtro activo
    if (search) complexityScore += 2;
    if (status) complexityScore += 1;
    if (type) complexityScore += 1;
    if (dateFrom || dateTo) complexityScore += 2;

    // Limitar consultas muy complejas para usuarios normales
    if (complexityScore > 5 && req.userRole !== 'admin') {
      return res.status(429).json({
        success: false,
        message: 'Consulta demasiado compleja. Reduzca el número de filtros o contacte al administrador'
      });
    }

    next();
  } catch (error) {
    console.error('Error en limitComplexQueries:', error);
    next(); // No interrumpir por error en este middleware
  }
};