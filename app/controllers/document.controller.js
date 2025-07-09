// documents.controller.js
import db from "../models/index.js";
import { QueryTypes } from "sequelize";

// Función para calcular el estado de un documento basado en fecha de vencimiento
const calculateDocumentStatus = (expirationDate) => {
  if (!expirationDate) return 'sin_fecha';
  
  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'vencido';
  if (diffDays <= 30) return 'por_vencer';
  return 'vigente';
};

// Función para validar formato de fecha
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Función para validar si existe una placa de vehículo
const validateVehicleExists = async (plateNumber) => {
  const vehicle = await db.sequelize.query(
    'SELECT plate_number FROM vehicles WHERE plate_number = :plate',
    {
      replacements: { plate: plateNumber },
      type: QueryTypes.SELECT
    }
  );
  return vehicle.length > 0;
};

// ================== ENDPOINTS DE CONSULTA ==================

// Controlador para obtener listado unificado de documentos
export const getDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6; // Según especificación: 6 elementos por página
    const offset = (page - 1) * limit;

    // Query para revisiones técnicas
    const technicalReviewsQuery = `
      SELECT 
        'REVISION' as tipo,
        tr.review_id as numero,
        tr.vehicle_plate as placa,
        tr.certifying_company as entidad_empresa,
        tr.issue_date as fecha_emision,
        tr.expiration_date as fecha_vencimiento,
        tr.inspection_result as estado_adicional,
        vt.name as clase_vehiculo,
        'technical_review' as source_table,
        tr.review_id as document_id
      FROM technical_reviews tr
      LEFT JOIN vehicles v ON tr.vehicle_plate = v.plate_number
      LEFT JOIN vehicle_types vt ON v.type_id = vt.type_id
      ORDER BY tr.expiration_date DESC
    `;

    // Query para seguros AFOCAT
    const insurancesQuery = `
      SELECT 
        'AFOCAT' as tipo,
        i.policy_number as numero,
        i.vehicle_plate as placa,
        i.insurance_company_name as entidad_empresa,
        i.start_date as fecha_emision,
        i.expiration_date as fecha_vencimiento,
        i.coverage as estado_adicional,
        vt.name as clase_vehiculo,
        'insurance' as source_table,
        i.id as document_id
      FROM insurances i
      LEFT JOIN vehicles v ON i.vehicle_plate = v.plate_number
      LEFT JOIN vehicle_types vt ON v.type_id = vt.type_id
      ORDER BY i.expiration_date DESC
    `;

    // Ejecutar ambas queries
    const [technicalReviews, insurances] = await Promise.all([
      db.sequelize.query(technicalReviewsQuery, {
        type: QueryTypes.SELECT
      }),
      db.sequelize.query(insurancesQuery, {
        type: QueryTypes.SELECT
      })
    ]);

    // Combinar y ordenar todos los documentos por fecha de vencimiento
    const allDocuments = [...technicalReviews, ...insurances].sort((a, b) => {
      const dateA = new Date(a.fecha_vencimiento);
      const dateB = new Date(b.fecha_vencimiento);
      return dateB - dateA; // Ordenar por fecha más reciente primero
    });

    // Aplicar paginación
    const paginatedDocuments = allDocuments.slice(offset, offset + limit);
    const total = allDocuments.length;
    const totalPages = Math.ceil(total / limit);

    // Formatear los datos de salida
    const formattedDocuments = paginatedDocuments.map(doc => {
      const estado = calculateDocumentStatus(doc.fecha_vencimiento);
      
      let detalles;
      if (doc.source_table === 'technical_review') {
        detalles = {
          resultado_inspeccion: doc.estado_adicional,
          clase_vehiculo: doc.clase_vehiculo || 'No especificada'
        };
      } else {
        detalles = {
          cobertura: doc.estado_adicional,
          clase_vehiculo: doc.clase_vehiculo || 'No especificada'
        };
      }

      return {
        tipo: doc.tipo,
        numero: doc.numero,
        placa: doc.placa,
        entidad_empresa: doc.entidad_empresa,
        fecha_emision: doc.fecha_emision,
        fecha_vencimiento: doc.fecha_vencimiento,
        estado: estado,
        detalles: detalles
      };
    });

    res.status(200).json({
      success: true,
      data: {
        documents: formattedDocuments,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_records: total,
          records_per_page: limit,
          has_next: page < totalPages,
          has_previous: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error en getDocuments:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener listado de documentos"
    });
  }
};

// Controlador para filtrar documentos por tipo
export const getDocumentsByType = async (req, res) => {
  try {
    const { type } = req.params; // 'revision' o 'afocat'
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    let query;
    let queryParams = { limit, offset };

    if (type.toLowerCase() === 'revision') {
      query = `
        SELECT 
          'REVISION' as tipo,
          tr.review_id as numero,
          tr.vehicle_plate as placa,
          tr.certifying_company as entidad_empresa,
          tr.issue_date as fecha_emision,
          tr.expiration_date as fecha_vencimiento,
          tr.inspection_result as estado_adicional,
          vt.name as clase_vehiculo,
          'technical_review' as source_table
        FROM technical_reviews tr
        LEFT JOIN vehicles v ON tr.vehicle_plate = v.plate_number
        LEFT JOIN vehicle_types vt ON v.type_id = vt.type_id
        ORDER BY tr.expiration_date DESC
        LIMIT :limit OFFSET :offset
      `;
    } else if (type.toLowerCase() === 'afocat') {
      query = `
        SELECT 
          'AFOCAT' as tipo,
          i.policy_number as numero,
          i.vehicle_plate as placa,
          i.insurance_company_name as entidad_empresa,
          i.start_date as fecha_emision,
          i.expiration_date as fecha_vencimiento,
          i.coverage as estado_adicional,
          vt.name as clase_vehiculo,
          'insurance' as source_table
        FROM insurances i
        LEFT JOIN vehicles v ON i.vehicle_plate = v.plate_number
        LEFT JOIN vehicle_types vt ON v.type_id = vt.type_id
        ORDER BY i.expiration_date DESC
        LIMIT :limit OFFSET :offset
      `;
    } else {
      return res.status(400).json({
        success: false,
        message: "Tipo de documento no válido. Use 'revision' o 'afocat'"
      });
    }

    // Query para contar total de documentos del tipo especificado
    const countQuery = type.toLowerCase() === 'revision' 
      ? 'SELECT COUNT(*) as total FROM technical_reviews'
      : 'SELECT COUNT(*) as total FROM insurances';

    const [documents, countResult] = await Promise.all([
      db.sequelize.query(query, {
        replacements: queryParams,
        type: QueryTypes.SELECT
      }),
      db.sequelize.query(countQuery, {
        type: QueryTypes.SELECT
      })
    ]);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Formatear documentos
    const formattedDocuments = documents.map(doc => {
      const estado = calculateDocumentStatus(doc.fecha_vencimiento);
      
      let detalles;
      if (doc.source_table === 'technical_review') {
        detalles = {
          resultado_inspeccion: doc.estado_adicional,
          clase_vehiculo: doc.clase_vehiculo || 'No especificada'
        };
      } else {
        detalles = {
          cobertura: doc.estado_adicional,
          clase_vehiculo: doc.clase_vehiculo || 'No especificada'
        };
      }

      return {
        tipo: doc.tipo,
        numero: doc.numero,
        placa: doc.placa,
        entidad_empresa: doc.entidad_empresa,
        fecha_emision: doc.fecha_emision,
        fecha_vencimiento: doc.fecha_vencimiento,
        estado: estado,
        detalles: detalles
      };
    });

    res.status(200).json({
      success: true,
      data: {
        documents: formattedDocuments,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_records: parseInt(total),
          records_per_page: limit,
          has_next: page < totalPages,
          has_previous: page > 1
        }
      }
    });

  } catch (error) {
    console.error("Error en getDocumentsByType:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener documentos por tipo"
    });
  }
};

// ================== ENDPOINTS DE CREACIÓN ==================

export const createTechnicalReview = async (req, res) => {
  try {
    const {
      review_id,
      vehicle_plate,
      issue_date,
      expiration_date,
      inspection_result,
      certifying_company
    } = req.body;

    // Validaciones
    if (!review_id || !vehicle_plate || !issue_date || !expiration_date || !inspection_result || !certifying_company) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios: review_id, vehicle_plate, issue_date, expiration_date, inspection_result, certifying_company"
      });
    }

    // Validar fechas
    if (!isValidDate(issue_date) || !isValidDate(expiration_date)) {
      return res.status(400).json({
        success: false,
        message: "Formato de fecha inválido. Use formato YYYY-MM-DD"
      });
    }

    // Validar que la fecha de vencimiento sea posterior a la de emisión
    if (new Date(expiration_date) <= new Date(issue_date)) {
      return res.status(400).json({
        success: false,
        message: "La fecha de vencimiento debe ser posterior a la fecha de emisión"
      });
    }

    // Validar resultado de inspección
    const validResults = ['APROBADO', 'OBSERVADO'];
    if (!validResults.includes(inspection_result.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "El resultado de inspección debe ser 'APROBADO' u 'OBSERVADO'"
      });
    }

    // Validar que el vehículo existe
    const vehicleExists = await validateVehicleExists(vehicle_plate);
    if (!vehicleExists) {
      return res.status(404).json({
        success: false,
        message: "El vehículo con la placa especificada no existe"
      });
    }

    // Crear la revisión técnica usando el modelo de Sequelize
    const technicalReview = await db.TechnicalReview.create({
      review_id,
      vehicle_plate,
      issue_date,
      expiration_date,
      inspection_result: inspection_result.toUpperCase(),
      certifying_company
    });

    res.status(201).json({
      success: true,
      message: "Revisión técnica creada exitosamente",
      data: {
        review_id: technicalReview.review_id,
        vehicle_plate: technicalReview.vehicle_plate,
        issue_date: technicalReview.issue_date,
        expiration_date: technicalReview.expiration_date,
        inspection_result: technicalReview.inspection_result,
        certifying_company: technicalReview.certifying_company,
        createdAt: technicalReview.createdAt,
        updatedAt: technicalReview.updatedAt
      }
    });

  } catch (error) {
    console.error("Error en createTechnicalReview:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: "Ya existe una revisión técnica para este vehículo con estos datos"
      });
    }
    res.status(500).json({
      success: false,
      message: "Error al crear la revisión técnica"
    });
  }
};

// Crear nuevo seguro AFOCAT
export const createInsurance = async (req, res) => {
  try {
    const {
      insurance_company_name,
      policy_number,
      vehicle_plate,
      start_date,
      expiration_date,
      coverage,
      license_id,
      owner_dni
    } = req.body;

    // Validaciones básicas
    if (!insurance_company_name || !policy_number || !vehicle_plate || !start_date || !expiration_date || !coverage || !owner_dni) {
      return res.status(400).json({
        success: false,
        message: "Los campos obligatorios son: insurance_company_name, policy_number, vehicle_plate, start_date, expiration_date, coverage, owner_dni"
      });
    }

    // Validar fechas
    if (!isValidDate(start_date) || !isValidDate(expiration_date)) {
      return res.status(400).json({
        success: false,
        message: "Formato de fecha inválido. Use formato YYYY-MM-DD"
      });
    }

    // Validar que la fecha de vencimiento sea posterior a la de inicio
    if (new Date(expiration_date) <= new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: "La fecha de vencimiento debe ser posterior a la fecha de inicio"
      });
    }

    // Validar que el vehículo existe
    const vehicleExists = await validateVehicleExists(vehicle_plate);
    if (!vehicleExists) {
      return res.status(404).json({
        success: false,
        message: "El vehículo con la placa especificada no existe"
      });
    }

    // Validar que el propietario existe
    const ownerExists = await db.sequelize.query(
      'SELECT dni FROM owners WHERE dni = :dni',
      {
        replacements: { dni: owner_dni },
        type: QueryTypes.SELECT
      }
    );

    if (ownerExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "El propietario con el DNI especificado no existe"
      });
    }

    // Validar licencia si se proporciona
    if (license_id) {
      const licenseExists = await db.sequelize.query(
        'SELECT license_id FROM driving_licenses WHERE license_id = :license_id',
        {
          replacements: { license_id },
          type: QueryTypes.SELECT
        }
      );

      if (licenseExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: "La licencia especificada no existe"
        });
      }
    }

    // Crear el seguro
    const insertQuery = `
      INSERT INTO insurances (insurance_company_name, policy_number, vehicle_plate, start_date, expiration_date, coverage, license_id, owner_dni)
      VALUES (:insurance_company_name, :policy_number, :vehicle_plate, :start_date, :expiration_date, :coverage, :license_id, :owner_dni)
    `;

    await db.sequelize.query(insertQuery, {
      replacements: {
        insurance_company_name,
        policy_number,
        vehicle_plate,
        start_date,
        expiration_date,
        coverage,
        license_id: license_id || null,
        owner_dni
      },
      type: QueryTypes.INSERT
    });

    res.status(201).json({
      success: true,
      message: "Seguro AFOCAT creado exitosamente",
      data: {
        insurance_company_name,
        policy_number,
        vehicle_plate,
        start_date,
        expiration_date,
        coverage,
        license_id: license_id || null,
        owner_dni
      }
    });

  } catch (error) {
    console.error("Error en createInsurance:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: "Ya existe un seguro con este número de póliza"
      });
    }
    res.status(500).json({
      success: false,
      message: "Error al crear el seguro AFOCAT"
    });
  }
};

// ================== ENDPOINTS DE ACTUALIZACIÓN ==================

// Actualizar revisión técnica
export const updateTechnicalReview = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vehicle_plate,
      issue_date,
      expiration_date,
      inspection_result,
      certifying_company
    } = req.body;

    // Verificar que la revisión técnica existe
    const existingReview = await db.sequelize.query(
      'SELECT review_id FROM technical_reviews WHERE review_id = :id',
      {
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );

    if (existingReview.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Revisión técnica no encontrada"
      });
    }

    // Validar campos si se proporcionan
    if (issue_date && !isValidDate(issue_date)) {
      return res.status(400).json({
        success: false,
        message: "Formato de fecha de emisión inválido"
      });
    }

    if (expiration_date && !isValidDate(expiration_date)) {
      return res.status(400).json({
        success: false,
        message: "Formato de fecha de vencimiento inválido"
      });
    }

    if (issue_date && expiration_date && new Date(expiration_date) <= new Date(issue_date)) {
      return res.status(400).json({
        success: false,
        message: "La fecha de vencimiento debe ser posterior a la fecha de emisión"
      });
    }

    if (inspection_result && !['APROBADO', 'OBSERVADO'].includes(inspection_result.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "El resultado de inspección debe ser 'APROBADO' u 'OBSERVADO'"
      });
    }

    if (vehicle_plate) {
      const vehicleExists = await validateVehicleExists(vehicle_plate);
      if (!vehicleExists) {
        return res.status(404).json({
          success: false,
          message: "El vehículo con la placa especificada no existe"
        });
      }
    }

    // Construir la query de actualización dinámicamente
    const fieldsToUpdate = [];
    const replacements = { id };

    if (vehicle_plate) {
      fieldsToUpdate.push('vehicle_plate = :vehicle_plate');
      replacements.vehicle_plate = vehicle_plate;
    }
    if (issue_date) {
      fieldsToUpdate.push('issue_date = :issue_date');
      replacements.issue_date = issue_date;
    }
    if (expiration_date) {
      fieldsToUpdate.push('expiration_date = :expiration_date');
      replacements.expiration_date = expiration_date;
    }
    if (inspection_result) {
      fieldsToUpdate.push('inspection_result = :inspection_result');
      replacements.inspection_result = inspection_result.toUpperCase();
    }
    if (certifying_company) {
      fieldsToUpdate.push('certifying_company = :certifying_company');
      replacements.certifying_company = certifying_company;
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron campos para actualizar"
      });
    }

    const updateQuery = `
      UPDATE technical_reviews 
      SET ${fieldsToUpdate.join(', ')}
      WHERE review_id = :id
    `;

    await db.sequelize.query(updateQuery, {
      replacements,
      type: QueryTypes.UPDATE
    });

    res.status(200).json({
      success: true,
      message: "Revisión técnica actualizada exitosamente"
    });

  } catch (error) {
    console.error("Error en updateTechnicalReview:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar la revisión técnica"
    });
  }
};

// Actualizar seguro AFOCAT
export const updateInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      insurance_company_name,
      policy_number,
      vehicle_plate,
      start_date,
      expiration_date,
      coverage,
      license_id,
      owner_dni
    } = req.body;

    // Verificar que el seguro existe
    const existingInsurance = await db.sequelize.query(
      'SELECT id FROM insurances WHERE id = :id',
      {
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );

    if (existingInsurance.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seguro AFOCAT no encontrado"
      });
    }

    // Validaciones
    if (start_date && !isValidDate(start_date)) {
      return res.status(400).json({
        success: false,
        message: "Formato de fecha de inicio inválido"
      });
    }

    if (expiration_date && !isValidDate(expiration_date)) {
      return res.status(400).json({
        success: false,
        message: "Formato de fecha de vencimiento inválido"
      });
    }

    if (start_date && expiration_date && new Date(expiration_date) <= new Date(start_date)) {
      return res.status(400).json({
        success: false,
        message: "La fecha de vencimiento debe ser posterior a la fecha de inicio"
      });
    }

    if (vehicle_plate) {
      const vehicleExists = await validateVehicleExists(vehicle_plate);
      if (!vehicleExists) {
        return res.status(404).json({
          success: false,
          message: "El vehículo con la placa especificada no existe"
        });
      }
    }

    if (owner_dni) {
      const ownerExists = await db.sequelize.query(
        'SELECT dni FROM owners WHERE dni = :dni',
        {
          replacements: { dni: owner_dni },
          type: QueryTypes.SELECT
        }
      );

      if (ownerExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: "El propietario con el DNI especificado no existe"
        });
      }
    }

    if (license_id) {
      const licenseExists = await db.sequelize.query(
        'SELECT license_id FROM driving_licenses WHERE license_id = :license_id',
        {
          replacements: { license_id },
          type: QueryTypes.SELECT
        }
      );

      if (licenseExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: "La licencia especificada no existe"
        });
      }
    }

    // Construir la query de actualización dinámicamente
    const fieldsToUpdate = [];
    const replacements = { id };

    if (insurance_company_name) {
      fieldsToUpdate.push('insurance_company_name = :insurance_company_name');
      replacements.insurance_company_name = insurance_company_name;
    }
    if (policy_number) {
      fieldsToUpdate.push('policy_number = :policy_number');
      replacements.policy_number = policy_number;
    }
    if (vehicle_plate) {
      fieldsToUpdate.push('vehicle_plate = :vehicle_plate');
      replacements.vehicle_plate = vehicle_plate;
    }
    if (start_date) {
      fieldsToUpdate.push('start_date = :start_date');
      replacements.start_date = start_date;
    }
    if (expiration_date) {
      fieldsToUpdate.push('expiration_date = :expiration_date');
      replacements.expiration_date = expiration_date;
    }
    if (coverage) {
      fieldsToUpdate.push('coverage = :coverage');
      replacements.coverage = coverage;
    }
    if (license_id !== undefined) {
      fieldsToUpdate.push('license_id = :license_id');
      replacements.license_id = license_id || null;
    }
    if (owner_dni) {
      fieldsToUpdate.push('owner_dni = :owner_dni');
      replacements.owner_dni = owner_dni;
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron campos para actualizar"
      });
    }

    const updateQuery = `
      UPDATE insurances 
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = :id
    `;

    await db.sequelize.query(updateQuery, {
      replacements,
      type: QueryTypes.UPDATE
    });

    res.status(200).json({
      success: true,
      message: "Seguro AFOCAT actualizado exitosamente"
    });

  } catch (error) {
    console.error("Error en updateInsurance:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: "Ya existe un seguro con este número de póliza"
      });
    }
    res.status(500).json({
      success: false,
      message: "Error al actualizar el seguro AFOCAT"
    });
  }
};

// ================== ENDPOINTS DE ELIMINACIÓN ==================

// Eliminar revisión técnica
export const deleteTechnicalReview = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la revisión técnica existe
    const existingReview = await db.sequelize.query(
      'SELECT review_id FROM technical_reviews WHERE review_id = :id',
      {
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );

    if (existingReview.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Revisión técnica no encontrada"
      });
    }

    // Eliminar la revisión técnica
    await db.sequelize.query(
      'DELETE FROM technical_reviews WHERE review_id = :id',
      {
        replacements: { id },
        type: QueryTypes.DELETE
      }
    );

    res.status(200).json({
      success: true,
      message: "Revisión técnica eliminada exitosamente"
    });

  } catch (error) {
    console.error("Error en deleteTechnicalReview:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la revisión técnica"
    });
  }
};

// Eliminar seguro AFOCAT
export const deleteInsurance = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el seguro existe
    const existingInsurance = await db.sequelize.query(
      'SELECT id FROM insurances WHERE id = :id',
      {
        replacements: { id },
        type: QueryTypes.SELECT
      }
    );

    if (existingInsurance.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seguro AFOCAT no encontrado"
      });
    }

    // Eliminar el seguro
    await db.sequelize.query(
      'DELETE FROM insurances WHERE id = :id',
      {
        replacements: { id },
        type: QueryTypes.DELETE
      }
    );

    res.status(200).json({
      success: true,
      message: "Seguro AFOCAT eliminado exitosamente"
    });

  } catch (error) {
    console.error("Error en deleteInsurance:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el seguro AFOCAT"
    });
  }
};