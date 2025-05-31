export default (sequelize, Sequelize) => {
    const Company = sequelize.define("companies", {
        ruc: {
            type: Sequelize.STRING(11),
            primaryKey: true,
            allowNull: false,
            validate: {
                len: [11, 11],
                isNumeric: true
            },
            comment: 'RUC de la empresa'
        },
        name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255]
            }
        },
        address: {
            type: Sequelize.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        registrationDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            field: 'registration_date',
            comment: 'fecha_emision'
        },
        expirationDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            field: 'expiration_date', 
            comment: 'fecha_vencimiento'
        },
        rucStatus: {
            type: Sequelize.ENUM('ACTIVO', 'BAJA PROV.', 'SUSPENDIDO'),
            allowNull: false,
            defaultValue: 'ACTIVO',
            field: 'ruc_status',
            comment: 'estado_ruc'
        },
        rucUpdateDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            field: 'ruc_update_date',
            comment: 'fecha_actualizacion_ruc'
        }
    }, {
        tableName: 'companies',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['ruc']
            },
            {
                fields: ['name']
            },
            {
                fields: ['ruc_status']
            }
        ]
    });

    return Company;
};