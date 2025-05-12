import db from "../models/index.js";
const { role: Role } = db;

export const up = async () => {
    try {
        // Verificar si los roles ya existen antes de insertar
        const existingRoles = await Role.findAll({
            where: {
                name: ['admin', 'fiscalizador']
            }
        });

        const existingNames = existingRoles.map(role => role.name);
        
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
        ].filter(role => !existingNames.includes(role.name));

        if (roles.length > 0) {
            // Insertar solo los roles que no existen
            await Role.bulkCreate(roles);
            console.log(`Seeder de roles ejecutado exitosamente. Insertados ${roles.length} roles.`);
        } else {
            console.log('Los roles ya existen. No se insertaron nuevos roles.');
        }
    } catch (error) {
        console.error('Error al ejecutar el seeder de roles:', error);
        throw error;
    }
};

export const down = async () => {
    try {
        // Eliminar los roles
        const result = await Role.destroy({
            where: {
                name: ['admin', 'fiscalizador']
            }
        });
        
        console.log(`Seeder de roles revertido exitosamente. Eliminados ${result} roles.`);
    } catch (error) {
        console.error('Error al revertir el seeder de roles:', error);
        throw error;
    }
};