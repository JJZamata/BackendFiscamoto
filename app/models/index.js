// models/index.js
import Sequelize from "sequelize";
import dbConfig from "../config/db.config.js";

// Importar modelos existentes
import userModel from "./user.model.js";
import roleModel from "./role.model.js";

// Importar nuevos modelos
import companyModel from "./company.model.js";
import ownerModel from "./owner.model.js";
import vehicleModel from "./vehicle.model.js";
import driverModel from "./driver.model.js";
import drivingLicenseModel from "./driving_license.model.js";
import technicalReviewModel from "./technical_review.model.js";
import insuranceModel from "./insurance.model.js";
import photoModel from "./photo.model.js";
import controlRecordModel from "./control_record.model.js";
import recordPhotoModel from "./record_photo.model.js";
import compliantRecordModel from "./compliant_record.model.js";
import violationModel from "./violation.model.js";
import nonCompliantRecordModel from "./non_compliant_record.model.js";
import recordViolationModel from "./record_violation.model.js";
import vehicleTypeModel from "./vehicleType.model.js";

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
  port: dbConfig.PORT,
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Inicializar modelos existentes
db.user = userModel(sequelize, Sequelize);
db.role = roleModel(sequelize, Sequelize);

// Inicializar nuevos modelos
db.company = companyModel(sequelize, Sequelize);
db.owner = ownerModel(sequelize, Sequelize);
db.vehicleType = vehicleTypeModel(sequelize, Sequelize);
db.vehicle = vehicleModel(sequelize, Sequelize);
db.driver = driverModel(sequelize, Sequelize);
db.drivingLicense = drivingLicenseModel(sequelize, Sequelize);
db.technicalReview = technicalReviewModel(sequelize, Sequelize);
db.insurance = insuranceModel(sequelize, Sequelize);
db.photo = photoModel(sequelize, Sequelize);
db.controlRecord = controlRecordModel(sequelize, Sequelize);
db.recordPhoto = recordPhotoModel(sequelize, Sequelize);
db.compliantRecord = compliantRecordModel(sequelize, Sequelize);
db.violation = violationModel(sequelize, Sequelize);
db.nonCompliantRecord = nonCompliantRecordModel(sequelize, Sequelize);
db.recordViolation = recordViolationModel(sequelize, Sequelize);

// DEFINIR RELACIONES

// 1. Relaciones existentes (User-Role)
db.role.belongsToMany(db.user, {
  through: "user_roles",
  foreignKey: "roleId",
  otherKey: "userId"
});

db.user.belongsToMany(db.role, {
  through: "user_roles",
  foreignKey: "userId",
  otherKey: "roleId",
  as: "roles"
});

// 2. Relaciones de vehicle
db.company.hasMany(db.vehicle, {
  foreignKey: 'companyRuc',
  sourceKey: 'ruc',
  as: 'vehicles'
});

db.vehicle.belongsTo(db.company, {
  foreignKey: 'companyRuc',
  targetKey: 'ruc',
  as: 'company'
});

db.owner.hasMany(db.vehicle, {
  foreignKey: 'ownerDni',
  sourceKey: 'dni',
  as: 'vehicles'
});

db.vehicle.belongsTo(db.owner, {
  foreignKey: 'ownerDni',
  targetKey: 'dni',
  as: 'owner'
});

db.vehicleType.hasMany(db.vehicle, {
  foreignKey: 'typeId',
  sourceKey: 'typeId',
  as: 'vehicles'
});

db.vehicle.belongsTo(db.vehicleType, {
  foreignKey: 'typeId',
  targetKey: 'typeId',
  as: 'vehicleType'
});

// 3. Relaciones de Conductor y Licencia
db.driver.hasMany(db.drivingLicense, {
  foreignKey: 'driverDni',
  sourceKey: 'dni',
  as: 'licenses'
});

db.drivingLicense.belongsTo(db.driver, {
  foreignKey: 'driverDni',
  targetKey: 'dni',
  as: 'driver'
});

// 4. Relaciones de Revisión Técnica
db.vehicle.hasMany(db.technicalReview, {
  foreignKey: 'vehiclePlate',
  sourceKey: 'plateNumber',
  as: 'technicalReviews'
});

db.technicalReview.belongsTo(db.vehicle, {
  foreignKey: 'vehiclePlate',
  targetKey: 'plateNumber',
  as: 'vehicle'
});

// 5. Relaciones de Seguro (Insurance)
db.vehicle.hasMany(db.insurance, {
  foreignKey: 'vehiclePlate',
  sourceKey: 'plateNumber',
  as: 'insurances'
});

db.insurance.belongsTo(db.vehicle, {
  foreignKey: 'vehiclePlate',
  targetKey: 'plateNumber',
  as: 'vehicle'
});

db.drivingLicense.hasMany(db.insurance, {
  foreignKey: 'licenseId',
  sourceKey: 'licenseId',
  as: 'insurances'
});

db.insurance.belongsTo(db.drivingLicense, {
  foreignKey: 'licenseId',
  targetKey: 'licenseId',
  as: 'license'
});

db.owner.hasMany(db.insurance, {
  foreignKey: 'ownerDni',
  sourceKey: 'dni',
  as: 'insurances'
});

db.insurance.belongsTo(db.owner, {
  foreignKey: 'ownerDni',
  targetKey: 'dni',
  as: 'owner'
});

// 6. Relaciones de Fotos
db.user.hasMany(db.photo, {
  foreignKey: 'userId',
  as: 'photos'
});

db.photo.belongsTo(db.user, {
  foreignKey: 'userId',
  as: 'user'
});

// 7. Relaciones de Control Record y Fotos (Many-to-Many)
db.controlRecord.belongsToMany(db.photo, {
  through: db.recordPhoto,
  foreignKey: 'controlRecordId',
  otherKey: 'photoId',
  as: 'photos'
});

db.photo.belongsToMany(db.controlRecord, {
  through: db.recordPhoto,
  foreignKey: 'photoId',
  otherKey: 'controlRecordId',
  as: 'controlRecords'
});

// 8. Relaciones de Actas Conformes
db.controlRecord.hasOne(db.compliantRecord, {
  foreignKey: 'controlRecordId',
  as: 'compliantRecord'
});

db.compliantRecord.belongsTo(db.controlRecord, {
  foreignKey: 'controlRecordId',
  as: 'controlRecord'
});

db.vehicle.hasMany(db.compliantRecord, {
  foreignKey: 'vehiclePlate',
  sourceKey: 'plateNumber',
  as: 'compliantRecords'
});

db.compliantRecord.belongsTo(db.vehicle, {
  foreignKey: 'vehiclePlate',
  targetKey: 'plateNumber',
  as: 'vehicle'
});

// 9. Relaciones de Actas No Conformes
db.controlRecord.hasOne(db.nonCompliantRecord, {
  foreignKey: 'controlRecordId',
  as: 'nonCompliantRecord'
});

db.nonCompliantRecord.belongsTo(db.controlRecord, {
  foreignKey: 'controlRecordId',
  as: 'controlRecord'
});

db.company.hasMany(db.nonCompliantRecord, {
  foreignKey: 'companyRuc',
  sourceKey: 'ruc',
  as: 'nonCompliantRecords'
});

db.nonCompliantRecord.belongsTo(db.company, {
  foreignKey: 'companyRuc',
  targetKey: 'ruc',
  as: 'company'
});

db.drivingLicense.hasMany(db.nonCompliantRecord, {
  foreignKey: 'licenseId',
  sourceKey: 'licenseId',
  as: 'nonCompliantRecords'
});

db.nonCompliantRecord.belongsTo(db.drivingLicense, {
  foreignKey: 'licenseId',
  targetKey: 'licenseId',
  as: 'license'
});

db.vehicle.hasMany(db.nonCompliantRecord, {
  foreignKey: 'vehiclePlate',
  sourceKey: 'plateNumber',
  as: 'nonCompliantRecords'
});

db.nonCompliantRecord.belongsTo(db.vehicle, {
  foreignKey: 'vehiclePlate',
  targetKey: 'plateNumber',
  as: 'vehicle'
});

// 10. Relaciones de Infracciones (Many-to-Many)
db.nonCompliantRecord.belongsToMany(db.violation, {
  through: db.recordViolation,
  foreignKey: 'nonCompliantRecordId',
  otherKey: 'violationId',
  as: 'violations'
});

db.violation.belongsToMany(db.nonCompliantRecord, {
  through: db.recordViolation,
  foreignKey: 'violationId',
  otherKey: 'nonCompliantRecordId',
  as: 'nonCompliantRecords'
});

// Definir roles permitidos
db.ROLES = ["admin", "fiscalizador"];

// Función para inicializar la base de datos
db.initializeDatabase = async () => {
  try {
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: process.env.NODE_ENV === 'test' // Solo para testing
    });
    console.log("Base de datos sincronizada correctamente");

    // Inicializar roles por defecto
    await db.role.initializeRoles();
    console.log("Roles inicializados correctamente");

    // Inicializar datos de prueba en desarrollo
    if (process.env.NODE_ENV === 'development') {
      await initializeDefaultData();
      await initializeVehicleTypes();
    }

    return true;
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    throw error;
  }
};

// Función para inicializar datos básicos (opcional)
const initializeDefaultData = async () => {
  try {
    // Crear algunas infracciones por defecto
    const defaultViolations = [
      {
        code: 'M41',
        description: 'Conducir vehículo sin portar licencia de conducir',
        severity: 'very_serious',
        uitPercentage: 100.00,
        administrativeMeasure: 'Retención del vehículo'
      },
      {
        code: 'L01',
        description: 'Conducir con documentos vencidos',
        severity: 'serious',
        uitPercentage: 50.00,
        administrativeMeasure: 'Papeleta de infracción'
      }
    ];

    for (const violation of defaultViolations) {
      await db.violation.findOrCreate({
        where: { code: violation.code },
        defaults: violation
      });
    }

    console.log("Datos por defecto inicializados correctamente");
  } catch (error) {
    console.error("Error al inicializar datos por defecto:", error);
  }
};

const initializeVehicleTypes = async () => {
  try {
    const defaultVehicleTypes = [
      {
        name: 'Mototaxi',
        description: 'Vehículo de tres ruedas para transporte de pasajeros'
      },
      {
        name: 'Automóvil',
        description: 'Vehículo de cuatro ruedas para transporte personal'
      },
      {
        name: 'Camión',
        description: 'Vehículo pesado para transporte de carga'
      },
      {
        name: 'Bus',
        description: 'Vehículo para transporte público de pasajeros'
      }
    ];

    for (const vehicleType of defaultVehicleTypes) {
      await db.vehicleType.findOrCreate({
        where: { name: vehicleType.name },
        defaults: vehicleType
      });
    }

    console.log("Tipos de vehículo inicializados correctamente");
  } catch (error) {
    console.error("Error al inicializar tipos de vehículo:", error);
  }
};

export default db;