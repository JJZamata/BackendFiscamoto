/**
 * Utilidad para detectar la plataforma del cliente
 * @param {string} userAgent - El User-Agent del request
 * @returns {string} - 'android', 'ios' o 'web'
 */
export const detectPlatformFromUserAgent = (userAgent) => {
  if (!userAgent) return 'web';

  const ua = userAgent.toLowerCase();
  
  // Detectar Android
  if (ua.includes('android')) {
    return 'android';
  }
  
  // Detectar iOS
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'ios';
  }
  
  // Por defecto, asumimos web
  return 'web';
};

/**
 * Obtiene la plataforma del request, priorizando el campo explícito
 * @param {Object} req - Request object de Express
 * @returns {string} - 'android', 'ios' o 'web'
 */
export const getPlatformFromRequest = (req) => {
  // 1. Intentar obtener del campo explícito platform
  if (req.body.platform && ['android', 'ios', 'web'].includes(req.body.platform)) {
    return req.body.platform;
  }

  // 2. Intentar obtener del header X-Platform
  const platformHeader = req.headers['x-platform'];
  if (platformHeader && ['android', 'ios', 'web'].includes(platformHeader)) {
    return platformHeader;
  }

  // 3. Detectar desde User-Agent
  return detectPlatformFromUserAgent(req.headers['user-agent']);
}; 