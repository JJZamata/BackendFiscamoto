export default {
  secret: process.env.JWT_SECRET || "fallback-secret", // Nunca hardcodear
  jwtExpiration: 3600, // 1 hora
  jwtRefreshExpiration: 86400, // 24 horas
  
  // Configuraciones específicas por rol
  roles: {
    admin: {
      tokenExpiration: 3600, // 1 hora para admin
      requiresDeviceInfo: false,
      allowedOrigins: process.env.ADMIN_ALLOWED_ORIGINS ? process.env.ADMIN_ALLOWED_ORIGINS.split(',') : ['http://localhost:5173']
    },
    fiscalizador: {
      tokenExpiration: 7200, // 2 horas para fiscalizador
      requiresDeviceInfo: true,
      allowedOrigins: process.env.FISCALIZADOR_ALLOWED_ORIGINS ? process.env.FISCALIZADOR_ALLOWED_ORIGINS.split(',') : ['capacitor://localhost']
    }
  },

  // Configuración de seguridad
  security: {
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutos
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    requireLowercase: true
  }
};