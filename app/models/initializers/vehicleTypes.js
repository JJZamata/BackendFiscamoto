export const initializeVehicleTypes = async (db) => {
  try {
    const defaultVehicleTypes = [
      {
        name: 'Mototaxi',
        description: 'Vehículo de tres ruedas para transporte de pasajeros'
      },
      {
        name: 'Automóvil',
        description: 'Vehículo de cuatro ruedas para transporte personal'
      },
      {
        name: 'Camión',
        description: 'Vehículo pesado para transporte de carga'
      },
      {
        name: 'Bus',
        description: 'Vehículo para transporte público de pasajeros'
      }
    ];

    for (const vehicleType of defaultVehicleTypes) {
      await db.vehicleType.findOrCreate({
        where: { name: vehicleType.name },
        defaults: vehicleType
      });
    }

    console.log("Tipos de vehículo inicializados correctamente");
  } catch (error) {
    console.error("Error al inicializar tipos de vehículo:", error);
    throw error;
  }
};