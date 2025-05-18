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
                len: {
                    args: [3, 20],
                    msg: 'El nombre de usuario debe tener entre 3 y 20 caracteres'
                },
                is: {
                    args: /^[a-zA-Z0-9_]+$/,
                    msg: 'El nombre de usuario solo puede contener letras, números y guiones bajos'
                }
            }
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: 'Debe proporcionar un email válido'
                }
            }
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false
        },
        deviceInfo: {
            type: Sequelize.JSONB,
            allowNull: true,
            unique: true,
            validate: {
                isValidDeviceInfo(value) {
                    if (value && (!value.deviceId || typeof value.deviceId !== 'string')) {
                        throw new Error('El deviceInfo debe contener un deviceId válido');
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
            type: Sequelize.STRING,
            allowNull: true
        },
        lastLoginDevice: {
            type: Sequelize.STRING,
            allowNull: true
        }
    }, {
        hooks: {
            beforeValidate: async (user) => {
                // Validar que los fiscalizadores tengan deviceInfo
                if (user.roles && user.roles.some(role => role.name === 'fiscalizador')) {
                    if (!user.deviceInfo || !user.deviceInfo.deviceId) {
                        throw new Error('Los fiscalizadores deben tener un deviceInfo con deviceId registrado');
                    }
                }
                // Validar que los administradores no tengan deviceInfo
                if (user.roles && user.roles.some(role => role.name === 'admin')) {
                    if (user.deviceInfo) {
                        throw new Error('Los administradores no deben tener deviceInfo registrado');
                    }
                }
            }
        }
    });

    // Método de instancia para verificar si el usuario es fiscalizador
    User.prototype.isFiscalizador = function() {
        return this.roles && this.roles.some(role => role.name === 'fiscalizador');
    };

    // Método de instancia para verificar si el usuario es administrador
    User.prototype.isAdmin = function() {
        return this.roles && this.roles.some(role => role.name === 'admin');
    };

    // Método de instancia para verificar si el usuario requiere deviceInfo
    User.prototype.requiresDeviceInfo = function() {
        return this.isFiscalizador();
    };

    return User;
};