export default (sequelize, Sequelize) => {
    const VehicleType = sequelize.define("vehicle_types", {
        typeId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            field: 'type_id',
            comment: 'ID del tipo de vehículo'
        },
        name: {
            type: Sequelize.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 50]
            },
            comment: 'Nombre del tipo de vehículo'
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Descripción del tipo de vehículo'
        }
    }, {
        tableName: 'vehicle_types',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['type_id']
            },
            {
                fields: ['name']
            }
        ]
    });

    return VehicleType;
};