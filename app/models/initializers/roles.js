export const initializeRoles = async (db) => {
  try {
    await db.role.initializeRoles();
    console.log("Roles inicializados correctamente");
  } catch (error) {
    console.error("Error al inicializar roles:", error);
    throw error;
  }
};