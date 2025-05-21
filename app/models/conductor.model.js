// app/models/conductor.model.js
export default (sequelize, DataTypes) => {
  const Conductor = sequelize.define("Conductor", {
    nombre: DataTypes.STRING,
    dni: DataTypes.STRING,
    licencia: DataTypes.STRING,
    estadoLicencia: DataTypes.STRING,
    vehiculoAsignado: DataTypes.STRING,
    estadoGeneral: DataTypes.STRING,
    codigo: {
      type: DataTypes.STRING,
      unique: true,
    },
    foto: DataTypes.TEXT
  });

  return Conductor;
};
