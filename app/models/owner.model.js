export default (sequelize, Sequelize) => {
    const Owner = sequelize.define("owners", {
        dni: {
            type: Sequelize.STRING(8),
            primaryKey: true,
            allowNull: false,
            validate: {
                len: [8, 8],
                isNumeric: true
            },
            comment: 'DNI del propietario'
        },
        firstName: {
            type: Sequelize.STRING(100),
            allowNull: false,
            field: 'first_name',
            validate: {
                notEmpty: true,
                len: [1, 100],
                is: /^[A-ZÁÉÍÓÚÑ\s]+$/i
            }
        },
        lastName: {
            type: Sequelize.STRING(100),
            allowNull: false,
            field: 'last_name',
            validate: {
                notEmpty: true,
                len: [1, 100],
                is: /^[A-ZÁÉÍÓÚÑ\s]+$/i
            }
        },
        // CAMPOS AGREGADOS SEGÚN TU ESTRUCTURA
        phone: {
            type: Sequelize.STRING(9),
            allowNull: false,
            validate: {
                len: [9, 9],
                isNumeric: true
            },
            comment: 'Teléfono del propietario'
        },
        email: {
            type: Sequelize.STRING(50),
            allowNull: true,
            validate: {
                isEmail: true,
                len: [0, 50]
            },
            comment: 'Email del propietario'
        }
    }, {
        tableName: 'owners',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['dni']
            },
            {
                fields: ['first_name', 'last_name']
            },
            {
                fields: ['phone']
            }
        ],
        getterMethods: {
            fullName() {
                return `${this.firstName} ${this.lastName}`;
            }
        }
    });

    return Owner;
};