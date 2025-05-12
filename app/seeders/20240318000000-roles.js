import db from "../models/index.js";
const { role: Role } = db;

export const up = async () => {
  try {
    // Definir los roles por defecto
    const roles = [
      {
        name: 'admin',
        description: 'Administrador del sistema con acceso web',
        requiresImei: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'fiscalizador',
        description: 'Fiscalizador con acceso móvil',
        requiresImei: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insertar los roles
    await Role.bulkCreate(roles, {
      ignoreDuplicates: true // Ignorar si ya existen
    });

    console.log('Seeder de roles ejecutado exitosamente');
  } catch (error) {
    console.error('Error al ejecutar el seeder de roles:', error);
    throw error;
  }
};

export const down = async () => {
  try {
    // Eliminar los roles
    await Role.destroy({
      where: {
        name: ['admin', 'fiscalizador']
      }
    });

    console.log('Seeder de roles revertido exitosamente');
  } catch (error) {
    console.error('Error al revertir el seeder de roles:', error);
    throw error;
  }
}; 