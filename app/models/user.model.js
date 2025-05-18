export default (sequelize, Sequelize) => {
    const User = sequelize.define("users", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: Sequelize.STRING(20),
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 20],
                is: /^[a-zA-Z0-9_]+$/
            }
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
            set(value) {
                const hash = bcrypt.hashSync(value, 10);
                this.setDataValue('password', hash);
            }
        },
        deviceInfo: {
            type: Sequelize.JSON,
            allowNull: true,
            validate: {
                isValidDeviceInfo(value) {
                    if (value) {
                        if (!value.deviceId || typeof value.deviceId !== 'string') {
                            throw new Error('deviceInfo debe contener un deviceId válido');
                        }
                        if (!value.platform || !['android', 'ios'].includes(value.platform)) {
                            throw new Error('Plataforma no válida');
                        }
                    }
                }
            }
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        lastLogin: {
            type: Sequelize.DATE,
            allowNull: true
        },
        lastLoginIp: {
            type: Sequelize.STRING(45),
            allowNull: true
        },
        lastLoginDevice: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    }, {
        hooks: {
            beforeValidate: async (user) => {
                if (user.isFiscalizador() && (!user.deviceInfo?.deviceId)) {
                    throw new Error('Los fiscalizadores deben registrar un dispositivo');
                }
                if (user.isAdmin() && user.deviceInfo) {
                    throw new Error('Los administradores no deben tener dispositivo registrado');
                }
            }
        },
        indexes: [
            {
                name: 'device_id_unique',
                fields: [sequelize.literal("(JSON_UNQUOTE(JSON_EXTRACT(deviceInfo, '$.deviceId')))")],
                unique: true,
                where: {
                    deviceInfo: {
                        [Sequelize.Op.ne]: null
                    }
                }
            },
            {
                fields: ['isActive']
            }
        ]
    });

    // Métodos mejorados
    User.prototype.isFiscalizador = function() {
        return this.roles?.some(role => role.name === 'fiscalizador') || false;
    };

    User.prototype.isAdmin = function() {
        return this.roles?.some(role => role.name === 'admin') || false;
    };

    User.prototype.verifyPassword = function(password) {
        return bcrypt.compareSync(password, this.password);
    };

    return User;
};