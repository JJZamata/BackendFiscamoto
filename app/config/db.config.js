import dotenv from 'dotenv';//accediendo a .env
dotenv.config();

export default {
  HOST: process.env.DB_HOST,//direccion
  USER: process.env.DB_USER,//usuario
  PASSWORD: process.env.DB_PASSWORD,//contraseña
  DB: process.env.DB_NAME,//nombre BD
  PORT: process.env.DB_PORT,//puerto DB
  dialect: "mysql",//motor de base de datos
  pool: {
    max: 5,//conexiones permitidas
    min: 0,//conexiones mantenidas
    acquire: 30000,//3segundos para conectarse o error
    idle: 10000//1 segundo para permanecer inactiva antes de ser liberada
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : {}
  }
};