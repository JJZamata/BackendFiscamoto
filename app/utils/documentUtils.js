/**
 * Calcula el estado de un documento basado en su fecha de vencimiento
 * @param {string|Date} expirationDate - Fecha de vencimiento
 * @returns {string} - Estado del documento
 */
export const calculateDocumentStatus = (expirationDate) => {
  if (!expirationDate) return 'no_tiene';
  
  const now = new Date();
  const expDate = new Date(expirationDate);
  const daysUntilExpiration = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiration > 30) return 'vigente';
  if (daysUntilExpiration > 0) return 'por_vencer';
  return 'vencido';
};

/**
 * Normaliza fechas para asegurar consistencia
 * @param {Object} data - Objeto con propiedades de fecha
 * @returns {Object} - Objeto con fechas normalizadas
 */
export const normalizeDates = (data) => {
  if (!data) return null;
  
  const dateFields = [
    'fecha_vencimiento_licencia',
    'fecha_vencimiento_ruc',
    'fecha_vencimiento',
    'expiration_date'
  ];
  
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      dateFields.includes(key) && value ? new Date(value) : value
    ])
  );
};