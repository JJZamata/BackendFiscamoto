import bcrypt from 'bcrypt';

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
            type: Sequelize.JSON, // Asegúrate que es JSON y no STRING
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('deviceInfo');
                return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
            },
            validate: {
                isValidDeviceInfo(value) {
                if (value) {
                    const deviceData = typeof value === 'string' ? JSON.parse(value) : value;
                    if (!deviceData.deviceId || typeof deviceData.deviceId !== 'string') {
                    throw new Error('DEVICE_ID_REQUIRED');
                    }
                    if (!deviceData.platform || !['android', 'ios'].includes(deviceData.platform)) {
                    throw new Error('INVALID_PLATFORM');
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
                // Obtener roles actuales si existen
                const currentRoles = user.roles?.map(role => role.name) || [];
                
                // Verificar si es fiscalizador
                if (currentRoles.includes('fiscalizador')) {
                    if (!user.deviceInfo?.deviceId) {
                        throw new Error('FISCALIZADOR_REQUIRES_DEVICE');
                    }
                }
                
                // Verificar si es admin
                if (currentRoles.includes('admin') && user.deviceInfo) {
                    throw new Error('ADMIN_CANNOT_HAVE_DEVICE');
                }
            }
        }
    });

    // Métodos de instancia
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