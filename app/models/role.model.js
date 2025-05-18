export default (sequelize, Sequelize) => {
    const Role = sequelize.define("roles", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: Sequelize.ENUM('admin', 'fiscalizador'),
            allowNull: false,
            unique: true,
        },
        description: {
            type: Sequelize.STRING,
            allowNull: true
        },
        requiresDeviceInfo: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    });

    // Método para inicializar roles por defecto
    Role.initializeRoles = async function() {
        const roles = [
            {
                name: 'admin',
                description: 'Administrador del sistema con acceso web',
                requiresDeviceInfo: false
            },
            {
                name: 'fiscalizador',
                description: 'Fiscalizador con acceso móvil',
                requiresDeviceInfo: true
            }
        ];

        for (const role of roles) {
            await this.findOrCreate({
                where: { name: role.name },
                defaults: role
            });
        }
    };

    return Role;
};