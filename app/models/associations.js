export const setupDatabaseAssociations = (db) => {
  // 1. Relaciones existentes (User-Role)
  db.role.belongsToMany(db.user, {
    through: "user_roles",
    foreignKey: "roleId",
    otherKey: "userId"
  });

  db.user.belongsToMany(db.role, {
    through: "user_roles",
    foreignKey: "userId",
    otherKey: "roleId",
    as: "roles"
  });

  // 2. Relaciones de vehicle
  db.company.hasMany(db.vehicle, {
    foreignKey: 'companyRuc',
    sourceKey: 'ruc',
    as: 'vehicles'
  });

  db.vehicle.belongsTo(db.company, {
    foreignKey: 'companyRuc',
    targetKey: 'ruc',
    as: 'company'
  });

  db.owner.hasMany(db.vehicle, {
    foreignKey: 'ownerDni',
    sourceKey: 'dni',
    as: 'vehicles'
  });

  db.vehicle.belongsTo(db.owner, {
    foreignKey: 'ownerDni',
    targetKey: 'dni',
    as: 'owner'
  });

  db.vehicleType.hasMany(db.vehicle, {
    foreignKey: 'typeId',
    sourceKey: 'typeId',
    as: 'vehicles'
  });

  db.vehicle.belongsTo(db.vehicleType, {
    foreignKey: 'typeId',
    targetKey: 'typeId',
    as: 'vehicleType'
  });

  // 3. Relaciones de Conductor y Licencia
  db.driver.hasMany(db.drivingLicense, {
    foreignKey: 'driverDni',
    sourceKey: 'dni',
    as: 'licenses'
  });

  db.drivingLicense.belongsTo(db.driver, {
    foreignKey: 'driverDni',
    targetKey: 'dni',
    as: 'driver'
  });

  // 4. Relaciones de Revisión Técnica
  db.vehicle.hasMany(db.technicalReview, {
    foreignKey: 'vehiclePlate',
    sourceKey: 'plateNumber',
    as: 'technicalReviews'
  });

  db.technicalReview.belongsTo(db.vehicle, {
    foreignKey: 'vehiclePlate',
    targetKey: 'plateNumber',
    as: 'vehicle'
  });

  // 5. Relaciones de Seguro (Insurance)
  db.vehicle.hasMany(db.insurance, {
    foreignKey: 'vehiclePlate',
    sourceKey: 'plateNumber',
    as: 'insurances'
  });

  db.insurance.belongsTo(db.vehicle, {
    foreignKey: 'vehiclePlate',
    targetKey: 'plateNumber',
    as: 'vehicle'
  });

  db.drivingLicense.hasMany(db.insurance, {
    foreignKey: 'licenseId',
    sourceKey: 'licenseId',
    as: 'insurances'
  });

  db.insurance.belongsTo(db.drivingLicense, {
    foreignKey: 'licenseId',
    targetKey: 'licenseId',
    as: 'license'
  });

  db.owner.hasMany(db.insurance, {
    foreignKey: 'ownerDni',
    sourceKey: 'dni',
    as: 'insurances'
  });

  db.insurance.belongsTo(db.owner, {
    foreignKey: 'ownerDni',
    targetKey: 'dni',
    as: 'owner'
  });

  // 6. Relaciones de Fotos
  db.user.hasMany(db.photo, {
    foreignKey: 'userId',
    as: 'photos'
  });

  db.photo.belongsTo(db.user, {
    foreignKey: 'userId',
    as: 'user'
  });

  // 7. Relaciones de Fotos con Actas (Campos separados)
  // Para Actas Conformes
  db.compliantRecord.belongsToMany(db.photo, {
    through: {
      model: db.recordPhoto,
      unique: false
    },
    foreignKey: 'compliantRecordId',
    otherKey: 'photoId',
    as: 'photos'
  });

  db.photo.belongsToMany(db.compliantRecord, {
    through: {
      model: db.recordPhoto,
      unique: false
    },
    foreignKey: 'photoId',
    otherKey: 'compliantRecordId',
    as: 'compliantRecords'
  });

  // Para Actas No Conformes
  db.nonCompliantRecord.belongsToMany(db.photo, {
    through: {
      model: db.recordPhoto,
      unique: false
    },
    foreignKey: 'nonCompliantRecordId',
    otherKey: 'photoId',
    as: 'photos'
  });

  db.photo.belongsToMany(db.nonCompliantRecord, {
    through: {
      model: db.recordPhoto,
      unique: false
    },
    foreignKey: 'photoId',
    otherKey: 'nonCompliantRecordId',
    as: 'nonCompliantRecords'
  });

  // 8. Relaciones de Actas Conformes
  db.user.hasMany(db.compliantRecord, {
    foreignKey: 'inspectorId',
    as: 'compliantRecords'
    });

    db.compliantRecord.belongsTo(db.user, {
        foreignKey: 'inspectorId',
        as: 'inspector'
    });

  db.drivingLicense.hasMany(db.compliantRecord, {
    foreignKey: 'licenseId',
    sourceKey: 'licenseId',
    as: 'compliantRecords'
  });

  db.compliantRecord.belongsTo(db.drivingLicense, {
    foreignKey: 'licenseId',
    targetKey: 'licenseId',
    as: 'license'
  });

  db.controlRecord.hasOne(db.compliantRecord, {
    foreignKey: 'controlRecordId',
    as: 'compliantRecord'
  });

  db.compliantRecord.belongsTo(db.controlRecord, {
    foreignKey: 'controlRecordId',
    as: 'controlRecord'
  });

  db.vehicle.hasMany(db.compliantRecord, {
    foreignKey: 'vehiclePlate',
    sourceKey: 'plateNumber',
    as: 'compliantRecords'
  });

  db.compliantRecord.belongsTo(db.vehicle, {
    foreignKey: 'vehiclePlate',
    targetKey: 'plateNumber',
    as: 'vehicle'
  });

  // 9. Relaciones de Actas No Conformes
  db.user.hasMany(db.nonCompliantRecord, {
    foreignKey: 'inspectorId',
    as: 'nonCompliantRecords'
  });

  db.nonCompliantRecord.belongsTo(db.user, {
    foreignKey: 'inspectorId',
    as: 'inspector'
  });

  db.controlRecord.hasOne(db.nonCompliantRecord, {
    foreignKey: 'controlRecordId',
    as: 'nonCompliantRecord'
  });

  db.nonCompliantRecord.belongsTo(db.controlRecord, {
    foreignKey: 'controlRecordId',
    as: 'controlRecord'
  });

  db.company.hasMany(db.nonCompliantRecord, {
    foreignKey: 'companyRuc',
    sourceKey: 'ruc',
    as: 'nonCompliantRecords'
  });

  db.nonCompliantRecord.belongsTo(db.company, {
    foreignKey: 'companyRuc',
    targetKey: 'ruc',
    as: 'company'
  });

  db.drivingLicense.hasMany(db.nonCompliantRecord, {
    foreignKey: 'licenseId',
    sourceKey: 'licenseId',
    as: 'nonCompliantRecords'
  });

  db.nonCompliantRecord.belongsTo(db.drivingLicense, {
    foreignKey: 'licenseId',
    targetKey: 'licenseId',
    as: 'license'
  });

  db.vehicle.hasMany(db.nonCompliantRecord, {
    foreignKey: 'vehiclePlate',
    sourceKey: 'plateNumber',
    as: 'nonCompliantRecords'
  });

  db.nonCompliantRecord.belongsTo(db.vehicle, {
    foreignKey: 'vehiclePlate',
    targetKey: 'plateNumber',
    as: 'vehicle'
  });

  // 10. Relaciones de Infracciones (Many-to-Many)
  db.nonCompliantRecord.belongsToMany(db.violation, {
    through: db.recordViolation,
    foreignKey: 'nonCompliantRecordId',
    otherKey: 'violationId',
    as: 'violations'
  });

  db.violation.belongsToMany(db.nonCompliantRecord, {
    through: db.recordViolation,
    foreignKey: 'violationId',
    otherKey: 'nonCompliantRecordId',
    as: 'nonCompliantRecords'
  });
};