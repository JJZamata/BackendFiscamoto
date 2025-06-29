//controllers/owner.controller.js
import db from "../models/index.js";
const { owner: Owner, vehicle: Vehicle } = db;

// Obtener propietario por DNI
export const getOwnerByDni = async (req, res) => {
  try {
    const { dni } = req.params;

    // Validar formato de DNI (8 dígitos)
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: "El DNI debe tener exactamente 8 dígitos"
      });
    }

    const owner = await Owner.findByPk(dni, {
      include: [{
        model: Vehicle,
        as: 'vehicles',
        attributes: ['plateNumber', 'vehicleStatus', 'brand', 'model', 'manufacturingYear']
      }]
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Propietario no encontrado"
      });
    }

    res.status(200).json({
      success: true,
      data: owner
    });
  } catch (error) {
    console.error("Error en getOwnerByDni:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos del propietario"
    });
  }
};

// Crear nuevo propietario
export const createOwner = async (req, res) => {
  try {
    const { dni, firstName, lastName, phone, email } = req.body;

    // Validar campos requeridos
    if (!dni || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: "DNI, nombres, apellidos y teléfono son campos requeridos"
      });
    }

    // Validar formato de DNI (8 dígitos)
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: "El DNI debe tener exactamente 8 dígitos"
      });
    }

    // Validar formato de teléfono (9 dígitos)
    if (!/^\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "El teléfono debe tener exactamente 9 dígitos"
      });
    }

    // Validar nombres y apellidos (solo letras, espacios y acentos)
    const nameRegex = /^[A-ZÁÉÍÓÚÑ\s]+$/i;
    if (!nameRegex.test(firstName)) {
      return res.status(400).json({
        success: false,
        message: "Los nombres solo pueden contener letras, espacios y acentos"
      });
    }

    if (!nameRegex.test(lastName)) {
      return res.status(400).json({
        success: false,
        message: "Los apellidos solo pueden contener letras, espacios y acentos"
      });
    }

    // Verificar si el propietario ya existe
    const existingOwner = await Owner.findByPk(dni);
    if (existingOwner) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un propietario con este DNI"
      });
    }

    // Validar email si se proporciona
    if (email && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Formato de email inválido"
        });
      }
    }

    const newOwner = await Owner.create({
      dni,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone,
      email: email?.trim() || null
    });

    res.status(201).json({
      success: true,
      message: "Propietario creado exitosamente",
      data: newOwner
    });
  } catch (error) {
    console.error("Error en createOwner:", error);
    
    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    // Manejar error de duplicado
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: "Ya existe un propietario con este DNI"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear el propietario"
    });
  }
};

// Actualizar propietario
export const updateOwner = async (req, res) => {
  try {
    const { dni } = req.params;
    const { firstName, lastName, phone, email } = req.body;

    // Validar formato de DNI
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: "El DNI debe tener exactamente 8 dígitos"
      });
    }

    // Buscar el propietario
    const owner = await Owner.findByPk(dni);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Propietario no encontrado"
      });
    }

    // Validar campos si se proporcionan
    if (firstName !== undefined) {
      if (firstName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Los nombres no pueden estar vacíos"
        });
      }
      const nameRegex = /^[A-ZÁÉÍÓÚÑ\s]+$/i;
      if (!nameRegex.test(firstName)) {
        return res.status(400).json({
          success: false,
          message: "Los nombres solo pueden contener letras, espacios y acentos"
        });
      }
    }

    if (lastName !== undefined) {
      if (lastName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Los apellidos no pueden estar vacíos"
        });
      }
      const nameRegex = /^[A-ZÁÉÍÓÚÑ\s]+$/i;
      if (!nameRegex.test(lastName)) {
        return res.status(400).json({
          success: false,
          message: "Los apellidos solo pueden contener letras, espacios y acentos"
        });
      }
    }

    if (phone !== undefined) {
      if (!/^\d{9}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "El teléfono debe tener exactamente 9 dígitos"
        });
      }
    }

    if (email !== undefined && email !== null && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Formato de email inválido"
        });
      }
    }

    // Actualizar solo los campos proporcionados
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email?.trim() || null;

    await owner.update(updateData);

    // Obtener el propietario actualizado
    const updatedOwner = await Owner.findByPk(dni);

    res.status(200).json({
      success: true,
      message: "Propietario actualizado exitosamente",
      data: updatedOwner
    });
  } catch (error) {
    console.error("Error en updateOwner:", error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar el propietario"
    });
  }
};

// Eliminar propietario
export const deleteOwner = async (req, res) => {
  try {
    const { dni } = req.params;

    // Validar formato de DNI
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: "El DNI debe tener exactamente 8 dígitos"
      });
    }

    // Buscar el propietario
    const owner = await Owner.findByPk(dni);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Propietario no encontrado"
      });
    }

    // Nota: Aquí se valida si el propietario tiene vehículos asociados
    // antes de permitir la eliminación
    const vehicleCount = await Vehicle.count({
      where: { ownerDni: dni }
    });

    if (vehicleCount > 0) {
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar el propietario. Tiene ${vehicleCount} vehículo(s) asociado(s). Elimine o reasigne los vehículos primero.`
      });
    }

    // Eliminar el propietario
    await owner.destroy();

    res.status(200).json({
      success: true,
      message: "Propietario eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error en deleteOwner:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el propietario"
    });
  }
};

// Eliminación masiva de propietarios (solo admin)
export const bulkDeleteOwners = async (req, res) => {
  try {
    const { dniList } = req.body;

    if (!Array.isArray(dniList) || dniList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere una lista de DNIs válida"
      });
    }

    // Validar formato de DNIs
    const invalidDnis = dniList.filter(dni => !/^\d{8}$/.test(dni));
    if (invalidDnis.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Algunos DNIs tienen formato inválido",
        data: { invalidDnis }
      });
    }

    // Verificar que ningún propietario tenga vehículos asociados
    const ownersWithVehicles = await Owner.findAll({
      where: { dni: dniList },
      include: [{
        model: Vehicle,
        as: 'vehicles',
        required: true,
        attributes: []
      }],
      attributes: ['dni', 'firstName', 'lastName']
    });

    if (ownersWithVehicles.length > 0) {
      return res.status(409).json({
        success: false,
        message: "No se pueden eliminar algunos propietarios porque tienen vehículos asociados",
        data: {
          ownersWithVehicles: ownersWithVehicles.map(o => ({
            dni: o.dni,
            fullName: `${o.firstName} ${o.lastName}`
          }))
        }
      });
    }

    // Eliminar propietarios
    const deletedCount = await Owner.destroy({
      where: { dni: dniList }
    });

    res.status(200).json({
      success: true,
      message: `${deletedCount} propietario(s) eliminado(s) exitosamente`,
      data: {
        deletedCount,
        requestedCount: dniList.length
      }
    });
  } catch (error) {
    console.error("Error en bulkDeleteOwners:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar propietarios en lote"
    });
  }
};