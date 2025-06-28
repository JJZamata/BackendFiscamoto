// models/non_compliant_record.model.js
export default (sequelize, Sequelize) => {
    const NonCompliantRecord = sequelize.define("non_compliant_records", {
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
        companyRuc: {
            type: Sequelize.STRING(11),
            allowNull: false,
            field: 'company_ruc',
            references: {
                model: 'companies',
                key: 'ruc'
            },
            validate: {
                len: [11, 11],
                isNumeric: true
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
        licenseId: {
            type: Sequelize.INTEGER,  // Cambiado a INTEGER para coincidir con la PK
            allowNull: true,//ya que no puede ver licencia
            field: 'license_id',
            references: {
                model: 'driving_licenses',
                key: 'license_id'
            },
            validate: {
                isInt: true,          // Validación para enteros
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
        observations: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        s3FileUrl: {
            type: Sequelize.TEXT,
            allowNull: true,//el escaneo del documento se hace luego
            field: 's3_file_url',
            validate: {
                notEmpty: true,
                isUrl: {
                    msg: 'Debe ser una URL válida de S3'
                }
            }
        }
    }, {
        tableName: 'non_compliant_records',
        timestamps: true,
        indexes: [
            {
                fields: ['control_record_id']
            },
            {
                fields: ['company_ruc']
            },
            {
                fields: ['vehicle_plate']
            },
            {
                fields: ['license_id']
            },
            {
                fields: ['inspector_id']
            },
            {
                fields: ['inspection_date_time']
            }
        ]
    });

    return NonCompliantRecord;
};