export const initializeDefaultViolations = async (db) => {
  try {
    const defaultViolations = [
      {
        code: 'M41',
        description: 'Conducir vehículo sin portar licencia de conducir',
        severity: 'very_serious',
        uitPercentage: 100.00,
        administrativeMeasure: 'Retención del vehículo'
      },
      {
        code: 'L01',
        description: 'Conducir con documentos vencidos',
        severity: 'serious',
        uitPercentage: 50.00,
        administrativeMeasure: 'Papeleta de infracción'
      }
    ];

    for (const violation of defaultViolations) {
      await db.violation.findOrCreate({
        where: { code: violation.code },
        defaults: violation
      });
    }

    console.log("Datos por defecto de infracciones inicializados correctamente");
  } catch (error) {
    console.error("Error al inicializar datos por defecto:", error);
    throw error;
  }
};