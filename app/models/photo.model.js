// models/photo.model.js
export default (sequelize, Sequelize) => {
    const Photo = sequelize.define("photos", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            },
            validate: {
                isInt: true,
                min: 1
            }
        },
        coordinates: {
            type: Sequelize.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
                isValidCoordinates(value) {
                    // Validar formato de coordenadas (ej: "-16.462,-71.503")
                    const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
                    if (!coordPattern.test(value)) {
                        throw new Error('Formato de coordenadas inválido. Use formato: "latitud,longitud"');
                    }
                }
            }
        },
        url: {
            type: Sequelize.TEXT,
            allowNull: false,
            /*
            validate: {
                notEmpty: true,
                isUrl: {
                    msg: 'Debe ser una URL válida'
                }
            }*/
        },
        captureDate: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'capture_date',
            defaultValue: Sequelize.NOW
        }
    }, {
        tableName: 'photos',
        timestamps: true,
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['capture_date']
            },
            {
                fields: ['coordinates']
            }
        ],
        getterMethods: {
            latitude() {
                if (!this.coordinates) return null;
                return parseFloat(this.coordinates.split(',')[0]);
            },
            longitude() {
                if (!this.coordinates) return null;
                return parseFloat(this.coordinates.split(',')[1]);
            }
        }
    });

    return Photo;
};