export const DRIVER_QUERY = `
  SELECT 
    d.dni,
    d.first_name AS nombre_conductor,
    d.last_name AS apellido_conductor,
    d.phone_number AS telefono_conductor,
    d.address AS direccion_conductor,
    dl.license_id,
    dl.license_number AS numero_licencia,
    dl.category AS categoria_licencia,
    dl.issue_date AS fecha_emision_licencia,
    dl.expiration_date AS fecha_vencimiento_licencia,
    dl.issuing_entity AS entidad_emisora,
    dl.restrictions AS restricciones
  FROM drivers d
  LEFT JOIN driving_licenses dl ON d.dni = dl.driver_dni
  WHERE d.dni = :dni
  ORDER BY dl.expiration_date DESC
  LIMIT 1
`;

export const VEHICLE_QUERY = `
  SELECT 
    v.plate_number AS placa_vehiculo,
    v.company_ruc,
    c.name AS nombre_empresa,
    c.address AS direccion_empresa,
    c.registration_date AS fecha_emision_ruc,
    c.expiration_date AS fecha_vencimiento_ruc,
    c.ruc_status AS estado_ruc,
    v.owner_dni,
    o.first_name AS nombre_propietario,
    o.last_name AS apellido_propietario,
    o.phone AS telefono_propietario,
    vt.name AS tipo_vehiculo
  FROM vehicles v
  LEFT JOIN companies c ON v.company_ruc = c.ruc
  LEFT JOIN owners o ON v.owner_dni = o.dni
  LEFT JOIN vehicle_types vt ON v.type_id = vt.type_id
  WHERE v.plate_number = :plateNumber
`;

export const INSURANCE_QUERY = `
  SELECT 
    id,
    insurance_company_name AS compania_seguros,
    policy_number AS numero_poliza,
    start_date AS fecha_inicio,
    expiration_date AS fecha_vencimiento,
    coverage AS cobertura
  FROM insurances
  WHERE vehicle_plate = :plateNumber
  ORDER BY expiration_date DESC
  LIMIT 1
`;

export const TECH_REVIEW_QUERY = `
  SELECT 
    review_id,
    issue_date AS fecha_emision,
    expiration_date AS fecha_vencimiento,
    inspection_result AS resultado_inspeccion,
    certifying_company AS empresa_certificadora
  FROM technical_reviews
  WHERE vehicle_plate = :plateNumber
  ORDER BY expiration_date DESC
  LIMIT 1
`;