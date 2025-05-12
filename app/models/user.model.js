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
        imei: {
            type: Sequelize.STRING(15),
            allowNull: true,
            unique: true,
            validate: {
                len: {
                    args: [15, 15],
                    msg: 'El IMEI debe tener exactamente 15 dígitos'
                },
                isNumeric: {
                    msg: 'El IMEI debe contener solo números'
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
                // Validar que los fiscalizadores tengan IMEI
                if (user.roles && user.roles.some(role => role.name === 'fiscalizador')) {
                    if (!user.imei) {
                        throw new Error('Los fiscalizadores deben tener un IMEI registrado');
                    }
                }
                // Validar que los administradores no tengan IMEI
                if (user.roles && user.roles.some(role => role.name === 'admin')) {
                    if (user.imei) {
                        throw new Error('Los administradores no deben tener IMEI registrado');
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

    // Método de instancia para verificar si el usuario requiere IMEI
    User.prototype.requiresImei = function() {
        return this.isFiscalizador();
    };

    return User;
};