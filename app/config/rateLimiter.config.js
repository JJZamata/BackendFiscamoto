import rateLimit from "express-rate-limit";

// Limitador para rutas de login (más restrictivo)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Por favor, intente nuevamente en 15 minutos.'
  },
  standardHeaders: true, // Retorna rate limit info en los headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
});

// Limitador para rutas generales (más flexible)
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 50, // 50 peticiones por minuto
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Por favor, intente nuevamente en 1 minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador para rutas críticas (intermedio)
export const criticalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 peticiones por minuto
  keyGenerator: (req) => `${req.user?.id || 'anonymous'}_${req.ip}`, // Usuario + IP por el momento anonymus aunque muy probable que se elimine
  message: {
    success: false,
    message: 'Demasiadas solicitudes a recursos críticos. Por favor, intente nuevamente en 1 minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Función helper para aplicar el limitador según el tipo de ruta
export const applyRateLimiter = (type) => {
  switch (type) {
    case 'login':
      return loginLimiter;
    case 'critical':
      return criticalLimiter;
    case 'general':
    default:
      return generalLimiter;
  }
}; 