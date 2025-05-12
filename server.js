import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import db from "./app/models/index.js";
import authRoutes from "./app/routes/auth.routes.js";
import userRoutes from "./app/routes/user.routes.js";

const app = express();

// Configuración de rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 peticiones por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde'
});

// Configuración de CORS más restrictiva
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ["http://localhost:5173", "http://localhost:8080"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

// Middleware de seguridad
app.use(helmet());
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta de prueba con mensaje más específico
app.get("/", (req, res) => {
  res.json({ 
    message: "API de FISCAMOTO - Sistema de Fiscalización",
    version: "1.0.0",
    status: "online"
  });
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/test", userRoutes);

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;

// Sincronización de la base de datos con opciones más seguras
db.sequelize.sync({ 
  force: false,
  logging: process.env.NODE_ENV === 'development' ? console.log : false
}).then(() => {
  console.log("Base de datos sincronizada correctamente");
}).catch(err => {
  console.error("Error al sincronizar la base de datos:", err);
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});