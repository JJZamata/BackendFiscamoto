/**
 * Utilidad para detectar la plataforma del cliente
 * @param {string} userAgent - El User-Agent del request
 * @returns {string} - 'android', 'ios' o 'web'
 */
export const detectPlatformFromUserAgent = (userAgent) => {
  if (!userAgent) return 'web';

  const ua = userAgent.toLowerCase();
  
  // Detectar Android (incluye dispositivos híbridos)
  if (ua.includes('android') || ua.includes('okhttp')) {
    return 'android';
  }
  
  // Detectar iOS (incluye todas las variantes)
  if (/iphone|ipad|ipod/i.test(ua) || ua.includes('cfnetwork')) {
    return 'ios';
  }
  
  // Por defecto, asumimos web
  return 'web';
};

/**
 * Obtiene la plataforma del request con prioridad mejorada
 * @param {Object} req - Request object de Express
 * @returns {string} - 'android', 'ios' o 'web'
 */
export const getPlatformFromRequest = (req) => {
  // 1. Prioridad máxima: campo explícito en el body
  if (req.body?.platform && ['android', 'ios', 'web'].includes(req.body.platform)) {
    return req.body.platform;
  }

  // 2. Prioridad alta: platform en deviceInfo (para móviles)
  if (req.body?.deviceInfo?.platform && ['android', 'ios'].includes(req.body.deviceInfo.platform)) {
    return req.body.deviceInfo.platform;
  }

  // 3. Header personalizado X-Platform
  const platformHeader = req.headers['x-platform'];
  if (platformHeader && ['android', 'ios', 'web'].includes(platformHeader.toLowerCase())) {
    return platformHeader.toLowerCase();
  }

  // 4. Detección automática desde User-Agent
  return detectPlatformFromUserAgent(req.headers['user-agent']);
};