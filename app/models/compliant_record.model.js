export default (sequelize, Sequelize) => {
    const CompliantRecord = sequelize.define("compliant_records", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        controlRecordId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'control_record_id',
            references: {
                model: 'control_records',
                key: 'id'
            },
            validate: {
                isInt: true,
                min: 1
            }
        },
        inspectorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'inspector_id',
            references: {
                model: 'users',
                key: 'id'
            },
            validate: {
                isInt: true,
                min: 1
            }
        },
        licenseId: {
            type: Sequelize.STRING(15),
            allowNull: false,
            field: 'license_id',
            references: {
                model: 'driving_licenses',
                key: 'license_id'
            },
            validate: {
                len: [5, 15],
                notEmpty: true
            }
        },
        vehiclePlate: {
            type: Sequelize.STRING(10),
            allowNull: false,
            field: 'vehicle_plate',
            references: {
                model: 'vehicles',
                key: 'plate_number'
            },
            validate: {
                len: [6, 10],
                is: /^[A-Z0-9]+$/
            }
        },
        inspectionDateTime: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'inspection_date_time',
            defaultValue: Sequelize.NOW
        },
        location: {
            type: Sequelize.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        observations: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        s3FileUrl: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 's3_file_url',
            validate: {
                notEmpty: true,
                isUrl: {
                    msg: 'Debe ser una URL válida de S3'
                }
            }
        }
    }, {
        tableName: 'compliant_records',
        timestamps: true,
        indexes: [
            {
                fields: ['control_record_id']
            },
            {
                fields: ['vehicle_plate']
            },
            {
                fields: ['inspector_id'] // Índice para fiscalizador
            },
            {
                fields: ['license_id'] // Índice para licencia
            },
            {
                fields: ['inspection_date_time']
            }
        ]
    });

    return CompliantRecord;
};