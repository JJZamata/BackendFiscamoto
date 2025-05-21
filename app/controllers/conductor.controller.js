import db from "../models/index.js";
const Conductor = db.conductor;

export const getAllConductores = async (req, res) => {
  try {
    let query = {};
    
    // Si es fiscalizador, solo mostrar conductores activos
    if (req.path.includes('/fiscalizador')) {
      query.where = {
        estadoGeneral: 'ACTIVO'
      };
    }
    
    // Si es ruta compartida, aplicar filtros específicos
    if (req.path.includes('/shared/active')) {
      query.where = {
        estadoGeneral: 'ACTIVO'
      };
    }

    const conductores = await Conductor.findAll(query);
    
    res.status(200).json({
      success: true,
      data: conductores,
      metadata: {
        total: conductores.length,
        path: req.path,
        role: req.user.roles.map(role => role.name)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener los conductores",
      error: error.message
    });
  }
}; 