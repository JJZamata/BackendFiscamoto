require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/database');

// Rutas
const authRoutes = require('./routes/auth.routes');

const app = express();

// Seguridad básica
app.use(cors());
app.use(helmet());
app.use(express.json());

// Limitar solicitudes (rate limiting)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

// Rutas
app.use('/api/auth', authRoutes);

// Conexión a DB y levantar servidor
const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
  }
})();
