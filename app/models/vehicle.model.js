export default (sequelize, Sequelize) => {
    const Vehicle = sequelize.define("vehicles", {
        plateNumber: {
            type: Sequelize.STRING(10),
            primaryKey: true,
            allowNull: false,
            field: 'plate_number',
            validate: {
                len: [6, 10],
                is: /^[A-Z0-9]+$/
            },
            comment: 'Placa del vehiculo'
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
        },
        typeId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'type_id',
            references: {
                model: 'vehicle_types',
                key: 'type_id'
            },
            comment: 'ID del tipo de vehículo'
        },
        vehicleStatus: {
            type: Sequelize.ENUM('OPERATIVO', 'REPARACIÓN', 'FUERA DE SERVICIO', 'INSPECCIÓN'),
            allowNull: false,
            defaultValue: 'OPERATIVO',
            field: 'vehicle_status'
        },
        brand: {
            type: Sequelize.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 50]
            }
        },
        model: {
            type: Sequelize.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 50]
            }
        },
        manufacturingYear: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'manufacturing_year',
            validate: {
                min: 1990,
                max: new Date().getFullYear() + 1,
                isInt: true
            },
            comment: 'anio_fabricacion'
        }
    }, {
        tableName: 'vehicles',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['plate_number']
            },
            {
                fields: ['company_ruc']
            },
            {
                fields: ['owner_dni']
            },
            {
                fields: ['vehicle_status']
            }
        ],
        getterMethods: {
            vehicleInfo() {
                return `${this.brand} ${this.model} (${this.manufacturingYear})`;
            },
            isOperational() {
                return this.vehicleStatus === 'OPERATIVO';
            }
        }
    });

    return Vehicle;
};