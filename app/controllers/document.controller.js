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