import Sequelize from "sequelize";
import dbConfig from "../config/db.config.js";
import { setupDatabaseAssociations } from "./associations.js";
import { initializeRoles } from "./initializers/roles.js";
import { initializeDefaultViolations } from "./initializers/defaultData.js";
import { initializeVehicleTypes } from "./initializers/vehicleTypes.js";

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
import recordPhotoModel from "./record_photo.model.js";
import compliantRecordModel from "./compliant_record.model.js";
import controlRecordModel from "./control_record.model.js";
import violationModel from "./violation.model.js";
import nonCompliantRecordModel from "./non_compliant_record.model.js";
import recordViolationModel from "./record_violation.model.js";
import vehicleTypeModel from "./vehicleType.model.js";

// Configuración de Sequelize
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
  port: dbConfig.PORT,
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// Objeto de base de datos
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
db.recordPhoto = recordPhotoModel(sequelize, Sequelize);
db.compliantRecord = compliantRecordModel(sequelize, Sequelize);
db.controlRecord = controlRecordModel(sequelize, Sequelize);
db.violation = violationModel(sequelize, Sequelize);
db.nonCompliantRecord = nonCompliantRecordModel(sequelize, Sequelize);
db.recordViolation = recordViolationModel(sequelize, Sequelize);

// Configurar todas las asociaciones
setupDatabaseAssociations(db);

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
    await initializeRoles(db);

    // Inicializar datos de desarrollo
    if (process.env.NODE_ENV === 'development') {
      await initializeDefaultViolations(db);
      await initializeVehicleTypes(db);
    }

    return true;
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    throw error;
  }
};

export default db;