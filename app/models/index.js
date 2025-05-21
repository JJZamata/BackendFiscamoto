import Sequelize from "sequelize";
import dbConfig from "../config/db.config.js";
import userModel from "./user.model.js";
import roleModel from "./role.model.js";
import conductorModel from "./conductor.model.js";

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

// Inicializar modelos
db.user = userModel(sequelize, Sequelize);
db.role = roleModel(sequelize, Sequelize);
db.conductor = conductorModel(sequelize, Sequelize);

// Definir relaciones
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

// Definir roles permitidos
db.ROLES = ["admin", "fiscalizador"];

// Función para inicializar la base de datos
db.initializeDatabase = async () => {
  try {
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log("Base de datos sincronizada correctamente");

    // Inicializar roles por defecto
    await db.role.initializeRoles();
    console.log("Roles inicializados correctamente");

    return true;
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    throw error;
  }
};

export default db;