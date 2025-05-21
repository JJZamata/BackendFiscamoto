export default {
  secret: process.env.JWT_SECRET || "fallback-secret", // Nunca hardcodear
  jwtExpiration: 3600, // 1 hora
  jwtRefreshExpiration: 86400, // 24 horas
  
  // Configuraciones específicas por rol
  roles: {
    admin: {
      tokenExpiration: 3600,
      requiresDeviceInfo: false,
      allowedOrigins: process.env.ADMIN_ALLOWED_ORIGINS 
        ? process.env.ADMIN_ALLOWED_ORIGINS.split(',') 
        : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000'])
    },
    fiscalizador: {
      tokenExpiration: 7200,
      requiresDeviceInfo: true,
      allowedOrigins: process.env.FISCALIZADOR_ALLOWED_ORIGINS 
        ? process.env.FISCALIZADOR_ALLOWED_ORIGINS.split(',') 
        : (process.env.NODE_ENV === 'production' ? [] : ['capacitor://localhost'])
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