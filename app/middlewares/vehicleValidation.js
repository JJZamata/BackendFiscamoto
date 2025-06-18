// middlewares/vehicleValidation.js
import { query, param, validationResult } from "express-validator";

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

// Validaciones para el listado de vehículos
export const validateVehicleQuery = [
  // Validación de paginación
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

  // Validación de búsqueda
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El término de búsqueda debe tener entre 1 y 100 caracteres')
    .trim()
    .escape(), // Escapar caracteres especiales para prevenir XSS

  // Validación de estado - Actualizado según el modelo
  query('status')
    .optional()
    .isIn(['OPERATIVO', 'REPARACIÓN', 'FUERA DE SERVICIO', 'INSPECCIÓN'])
    .withMessage('El estado debe ser: OPERATIVO, REPARACIÓN, FUERA DE SERVICIO o INSPECCIÓN'),

  // Validación de tipo de vehículo
  query('type')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El tipo debe ser un número entero positivo')
    .toInt(),

  // Validación de ordenamiento - Corregido según el modelo
  query('sortBy')
    .optional()
    .isIn(['plateNumber', 'vehicleStatus', 'brand', 'model', 'manufacturingYear', 'companyRuc', 'ownerDni'])
    .withMessage('Solo se puede ordenar por: plateNumber, vehicleStatus, brand, model, manufacturingYear, companyRuc, ownerDni'),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('El orden debe ser ASC o DESC')
    .toUpperCase(),

  // Middleware para manejar errores
  handleValidationErrors
];

// Validaciones para obtener vehículo por placa
export const validateVehicleByPlate = [
  param('plateNumber')
    .notEmpty()
    .withMessage('El número de placa es requerido')
    .isLength({ min: 6, max: 10 })
    .withMessage('El número de placa debe tener entre 6 y 10 caracteres')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('El número de placa solo puede contener letras mayúsculas y números')
    .trim(),

  handleValidationErrors
];

// Validaciones para estadísticas
export const validateVehicleStatsQuery = [
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('La fecha desde debe estar en formato ISO8601 (YYYY-MM-DD)')
    .toDate(),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('La fecha hasta debe estar en formato ISO8601 (YYYY-MM-DD)')
    .toDate(),

  query('groupBy')
    .optional()
    .isIn(['status', 'type', 'year', 'brand'])
    .withMessage('Solo se puede agrupar por: status, type, year, brand'),

  // Validación personalizada: dateFrom debe ser menor que dateTo
  query('dateFrom').custom((dateFrom, { req }) => {
    const dateTo = req.query.dateTo;
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      throw new Error('La fecha desde debe ser menor que la fecha hasta');
    }
    return true;
  }),

  handleValidationErrors
];

// Middleware para sanitizar datos de entrada
export const sanitizeVehicleQuery = (req, res, next) => {
  // Establecer valores por defecto si no se proporcionan
  req.query.page = req.query.page || 1;
  req.query.limit = req.query.limit || 6;
  req.query.sortBy = req.query.sortBy || 'plateNumber';
  req.query.sortOrder = req.query.sortOrder || 'ASC';

  // Remover campos vacíos o undefined
  Object.keys(req.query).forEach(key => {
    if (req.query[key] === '' || req.query[key] === 'undefined' || req.query[key] === 'null') {
      delete req.query[key];
    }
  });

  next();
};

// Middleware para logging de consultas
export const logVehicleQuery = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚗 Vehicle Query:', {
      endpoint: req.originalUrl,
      method: req.method,
      query: req.query,
      params: req.params,
      timestamp: new Date().toISOString()
    });
  }
  next();
};