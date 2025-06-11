import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from 'cookie-parser';
import db from "./app/models/index.js";
import authRoutes from "./app/routes/auth.routes.js";
import userRoutes from "./app/routes/user.routes.js";
import operationRoutes from "./app/routes/operation.routes.js";
import productionRoutes from "./app/routes/production.routes.js";
import driverRoutes from "./app/routes/driver.routes.js";
import authConfig from "./app/config/auth.config.js";
import companyRoutes from "./app/routes/company.routes.js";
import { generalLimiter } from "./app/config/rateLimiter.config.js";

const app = express();

app.set('trust proxy', 1);
// Configuración de CORS más restrictiva
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como apps móviles) - mejorar eso ojoojo
    if (!origin) return callback(null, true);
    
    // Obtener todos los orígenes permitidos de la configuración
    const allowedOrigins = [
      ...authConfig.roles.admin.allowedOrigins,
      ...authConfig.roles.fiscalizador.allowedOrigins
    ];
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true, // Permitir cookies en solicitudes CORS
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-DeviceInfo']
};

// Middleware de seguridad y configuración
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Middleware para manejar cookies

// Ruta de prueba con mensaje más específico
app.get("/", (req, res) => {
  res.json({ 
    message: "API de FISCAMOTO - Sistema de Fiscalización",
    version: "1.0.0",
    status: "online",
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); 
app.use("/api/operation", operationRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/production", productionRoutes); // Cambiado de /api/test a /api/production para consistencia
app.use("/api/drivers", driverRoutes);
// Cambiado de /api/test a /api/users para consistencia

// Manejador de errores global mejorado
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

// Función para inicializar el servidor
const startServer = async () => {
  try {
    // Inicializar la base de datos
    await db.initializeDatabase();
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log('Configuración de CORS:', corsOptions);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();