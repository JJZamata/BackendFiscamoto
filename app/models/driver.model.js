// models/driver.model.js
export default (sequelize, Sequelize) => {
    const Driver = sequelize.define("drivers", {
        dni: {
            type: Sequelize.STRING(8),
            primaryKey: true,
            allowNull: false,
            validate: {
                len: [8, 8],
                isNumeric: true
            },
            comment: 'DNI del conductor'
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
        phoneNumber: {
            type: Sequelize.STRING(15),
            allowNull: true,
            field: 'phone_number',
            validate: {
                is: /^[0-9+\-\s()]*$/,
                len: [9, 15]
            }
        },
        address: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        photoUrl: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'photo_url',
            validate: {
                isUrl: {
                    msg: 'Debe ser una URL válida'
                }
            }
        }
    }, {
        tableName: 'drivers',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['dni']
            },
            {
                fields: ['first_name', 'last_name']
            }
        ],
        getterMethods: {
            fullName() {
                return `${this.firstName} ${this.lastName}`;
            }
        }
    });

    return Driver;
};