// utils/platformDetector.js (versión mejorada)
export const detectPlatformFromUserAgent = (userAgent) => {
  if (!userAgent) return 'web';

  const ua = userAgent.toLowerCase();
  
  // Detectar Android
  if (ua.includes('android') || ua.includes('okhttp')) {
    return 'android';
  }
  
  // Detectar iOS
  if (/iphone|ipad|ipod|ios|cfnetwork/i.test(ua)) {
    return 'ios';
  }
  
  return 'web';
};

export const getPlatformFromRequest = (req) => {
  // 1. Prioridad máxima: Header X-Platform
  const platformHeader = req.headers['x-platform'];
  if (platformHeader && ['android', 'ios', 'web'].includes(platformHeader.toLowerCase())) {
    return platformHeader.toLowerCase();
  }

  // 2. Detección automática desde User-Agent
  return detectPlatformFromUserAgent(req.headers['user-agent']);
};

// Nueva función para obtener el deviceId
export const getDeviceIdFromRequest = (req) => {
  return req.headers['x-device-id'] || null;
};