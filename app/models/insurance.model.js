// models/insurance.model.js
export default (sequelize, Sequelize) => {
    const Insurance = sequelize.define("insurances", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        insuranceCompanyName: {
            type: Sequelize.STRING(100),
            allowNull: false,
            field: 'insurance_company_name',
            validate: {
                notEmpty: true,
                len: [1, 100]
            }
        },
        policyNumber: {
            type: Sequelize.STRING(20),
            allowNull: false,
            field: 'policy_number',
            validate: {
                notEmpty: true,
                len: [1, 20]
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
        startDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            field: 'start_date'
        },
        expirationDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            field: 'expiration_date',
            validate: {
                isAfterStartDate(value) {
                    if (value <= this.startDate) {
                        throw new Error('La fecha de vencimiento debe ser posterior a la fecha de inicio');
                    }
                }
            }
        },
        coverage: {
            type: Sequelize.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
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
        ownerDni: {
            type: Sequelize.STRING(8),
            allowNull: false,
            field: 'owner_dni',
            references: {
                model: 'owners',
                key: 'dni'
            },
            validate: {
                len: [8, 8],
                isNumeric: true
            }
        }
    }, {
        tableName: 'insurances',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['policy_number', 'insurance_company_name']
            },
            {
                fields: ['vehicle_plate']
            },
            {
                fields: ['license_id']
            },
            {
                fields: ['owner_dni']
            },
            {
                fields: ['expiration_date']
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
            },
            isActive() {
                const today = new Date();
                return today >= this.startDate && today <= this.expirationDate;
            }
        }
    });

    return Insurance;
};