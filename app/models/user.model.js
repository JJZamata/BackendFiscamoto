
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
            //unique: true,
            validate: {
                len: [3, 20],
                is: /^[a-zA-Z0-9_]+$/
            }
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            //unique: true,
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
            type: Sequelize.JSON, // JSON es correcto
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('deviceInfo');
                // Si es null o undefined, retornar null
                if (!rawValue) return null;
                // Si ya es objeto, retornarlo directamente
                if (typeof rawValue === 'object') return rawValue;
                // Si es string, parsearlo
                try {
                    return JSON.parse(rawValue);
                } catch (e) {
                    console.error('Error parsing deviceInfo:', e);
                    return null;
                }
            },
            validate: {
                isValidDeviceInfo(value) {
                    // Solo validar si hay valor (no en primer registro)
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
        },
        // Campo adicional para controlar el estado de configuración inicial
        deviceConfigured: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Indica si el fiscalizador ya configuró su dispositivo en el primer login'
        }
    }, {
        indexes: [
            {
                name: 'users_username_unique',
                unique: true,
                fields: ['username']
            },
            {
                name: 'users_email_unique', 
                unique: true,
                fields: ['email']
            }
        ],
        instanceMethods: {
      isAdmin() {
        if (!this.roles) return false;
        return this.roles.some(role => role.name === 'admin');
      },
      isFiscalizador() {
        if (!this.roles) return false;
        return this.roles.some(role => role.name === 'fiscalizador');
      }
    },hooks: {
            beforeValidate: async (user, options) => {
                // PROBLEMA IDENTIFICADO: Este hook se ejecuta antes de que los roles estén cargados
                // durante la creación, por lo que user.roles será undefined
                
                // Solo aplicar validaciones si no es una creación inicial
                if (!user.isNewRecord) {
                    // Para actualizaciones, necesitamos cargar los roles si no están presentes
                    if (!user.roles) {
                        const userWithRoles = await sequelize.models.users.findByPk(user.id, {
                            include: { model: sequelize.models.roles, as: "roles" }
                        });
                        user.roles = userWithRoles?.roles || [];
                    }
                    
                    const currentRoles = user.roles?.map(role => role.name) || [];
                    
                    // Verificar si es fiscalizador Y ya debería tener dispositivo configurado
                    if (currentRoles.includes('fiscalizador') && user.deviceConfigured && !user.deviceInfo?.deviceId) {
                        throw new Error('FISCALIZADOR_REQUIRES_DEVICE');
                    }
                    
                    // Verificar si es admin (los admins nunca deben tener deviceInfo)
                    if (currentRoles.includes('admin') && user.deviceInfo) {
                        throw new Error('ADMIN_CANNOT_HAVE_DEVICE');
                    }
                }
            },
            
            // Hook adicional para después de crear asociaciones
            afterCreate: async (user, options) => {
                // Este hook se ejecuta después de que el usuario y sus roles están creados
                // Aquí podríamos hacer validaciones adicionales si fuera necesario
                console.log(`Usuario creado: ${user.username}`);
            }
        }
    });

    // Métodos de instancia mejorados
    User.prototype.isFiscalizador = function() {
        return this.roles?.some(role => role.name === 'fiscalizador') || false;
    };

    User.prototype.isAdmin = function() {
        return this.roles?.some(role => role.name === 'admin') || false;
    };

    User.prototype.verifyPassword = function(password) {
        return bcrypt.compareSync(password, this.password);
    };

    // Nuevo método para configurar dispositivo en primer login
    User.prototype.configureDevice = async function(deviceInfo) {
        if (!this.isFiscalizador()) {
            throw new Error('Solo los fiscalizadores pueden configurar dispositivos');
        }

        if (this.deviceConfigured) {
            throw new Error('El dispositivo ya está configurado para este usuario');
        }

        const deviceData = {
            deviceId: deviceInfo.deviceId,
            platform: deviceInfo.platform,
            deviceName: deviceInfo.deviceName || 'Dispositivo móvil',
            registeredAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };

        await this.update({
            deviceInfo: deviceData,
            deviceConfigured: true
        });

        return deviceData;
    };

    // Método para verificar si el dispositivo coincide
    User.prototype.isAuthorizedDevice = function(deviceInfo) {
        if (!this.isFiscalizador() || !this.deviceConfigured) {
            return false;
        }

        const storedDevice = this.deviceInfo;
        return storedDevice && storedDevice.deviceId === deviceInfo.deviceId;
    };

    // Método para actualizar último uso del dispositivo
    User.prototype.updateDeviceUsage = async function() {
        if (this.deviceInfo) {
            const updatedDeviceInfo = {
                ...this.deviceInfo,
                lastUsed: new Date().toISOString()
            };
            
            await this.update({ deviceInfo: updatedDeviceInfo });
        }
    };

    return User;
};