export default (sequelize, Sequelize) => {
    const DrivingLicense = sequelize.define("driving_licenses", {
        licenseId: {
            type: Sequelize.STRING(15),
            primaryKey: true,
            allowNull: false,
            field: 'license_id',
            validate: {
                len: [5, 15],
                notEmpty: true
            },
            comment: 'ID único de la licencia'
        },
        driverDni: {
            type: Sequelize.STRING(8),
            allowNull: false,
            field: 'driver_dni',
            references: {
                model: 'drivers',
                key: 'dni'
            },
            validate: {
                len: [8, 8],
                isNumeric: true
            }
        },
        licenseNumber: {
            type: Sequelize.STRING(15),
            allowNull: false,
            field: 'license_number',
            validate: {
                len: [5, 15],
                notEmpty: true
            }
        },
        category: {
            type: Sequelize.ENUM(
                'A-I', 'A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc',
                'B-I', 'B-IIa', 'B-IIb', 'B-IIc'
            ),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        issueDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            field: 'issue_date'
        },
        expirationDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            field: 'expiration_date',
            validate: {
                isAfterIssueDate(value) {
                    if (value <= this.issueDate) {
                        throw new Error('La fecha de vencimiento debe ser posterior a la fecha de emisión');
                    }
                }
            }
        },
        issuingEntity: {
            type: Sequelize.STRING(100),
            allowNull: false,
            field: 'issuing_entity',
            validate: {
                notEmpty: true,
                len: [1, 100]
            }
        },
        restrictions: {
            type: Sequelize.ENUM(
                'SIN RESTRICCIONES',
                'LENTES CORRECTIVOS',
                'APARATOS AUDITIVOS',
                'PROTESIS EN MIEMBROS',
                'OTRAS RESTRICCIONES'
            ),
            allowNull: false,
            defaultValue: 'SIN RESTRICCIONES'
        }
    }, {
        tableName: 'driving_licenses',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['license_id']
            },
            {
                unique: true,
                fields: ['license_number']
            },
            {
                fields: ['driver_dni']
            },
            {
                fields: ['expiration_date']
            },
            {
                fields: ['category']
            }
        ],
        getterMethods: {
            isExpired() {
                return new Date() > this.expirationDate;
            },
            daysUntilExpiration() {
                const today = new Date();
                const expDate = new Date(this.expirationDate);
                const diffTime = expDate - today;
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }
    });

    return DrivingLicense;
};