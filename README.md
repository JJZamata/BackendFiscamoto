# FISCAMOTO API 🚗⚡

Sistema de Fiscalización de Mototaxis - Backend API RESTful

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/JWT-9.0.2-red.svg)](https://jwt.io/)

## 📋 Descripción

FISCAMOTO es una plataforma digital integral para la fiscalización y control de mototaxis, diseñada específicamente para gobiernos locales y municipalidades. La API REST proporciona funcionalidades completas de gestión, autenticación diferenciada y operaciones de campo.

### 🎯 Características Principales

- **🔐 Autenticación Diferenciada**: JWT con control por AndroidID para fiscalizadores móviles
- **📱 Multi-plataforma**: Portal web para administradores + App móvil para fiscalizadores
- **📸 Gestión Multimedia**: Procesamiento de imágenes a WebP con metadatos GPS
- **🚗 Control Vehicular**: Gestión completa de mototaxis, conductores y documentación
- **📋 Fiscalización Digital**: Actas con QR, infracciones categorizadas y evidencias fotográficas
- **☁️ Almacenamiento**: Integración con AWS S3 para imágenes

## 🏗️ Arquitectura del Sistema

La API está construida con Node.js + Express y sigue una arquitectura que separa claramente las responsabilidades:

- **🌐 Portal Web**: Exclusivo para administradores
- **📱 App Móvil (Flutter)**: Exclusiva para fiscalizadores de campo
- **🔐 Autenticación JWT**: Con control adicional por AndroidID
- **☁️ Almacenamiento AWS S3**: Para imágenes georreferenciadas

## 🚀 Instalación

### Prerrequisitos

- Node.js 18.x o superior
- MySQL 8.0 o superior
- npm

### 1. Clonar el repositorio

```bash
git clone https://github.com/Fabrica-de-Software-Tecsup/BackendFiscaMoto.git
cd BackendFiscaMoto
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` con la siguiente estructura:

```env
# CONFIGURACIÓN BÁSICA
PORT=4000
NODE_ENV=development

# SEGURIDAD Y AUTENTICACIÓN
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# BASE DE DATOS (MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fiscamoto_db
DB_PORT=3306

# CONFIGURACIÓN CORS
ADMIN_ALLOWED_ORIGINS=http://localhost:3000
FISCALIZADOR_ALLOWED_ORIGINS=capacitor://localhost
```

### 4. Configurar la base de datos

```bash
# Ejecutar seeders
npm run seed

# Para revertir seeders
npm run seed:down
```

### 5. Iniciar el servidor

```bash
# Desarrollo
npm start

# El servidor estará disponible en http://localhost:4000
```

## 📚 Documentación de la API

### 📖 Documentación Completa
**[Ver Documentación en Postman](https://documenter.getpostman.com/view/39175030/2sB2x9jqSU)**

La documentación incluye todos los endpoints organizados en módulos:
- 🔐 Autenticación
- 👥 Gestión de Usuarios  
- 🚗 Gestión Vehicular
- 📝 Fiscalización
- 📊 Reportes
- ⚙️ Configuración

## 🔐 Autenticación y Seguridad

### Flujo de Autenticación Diferenciado

#### 🌐 Administradores (Portal Web)
- Acceso desde navegadores web
- Tokens JWT en cookies HTTP-only
- Protección CSRF y XSS

#### 📱 Fiscalizadores (App Móvil)
- Acceso desde apps móviles
- Tokens JWT en response body  
- Control por AndroidID único

### Headers Requeridos (Solo App Móvil - Login)

```javascript
{
  "X-Device-Id": "android_unique_id",
  "X-Platform": "android|ios", 
  "X-Device-Name": "device_name",
  "User-Agent": "device_info"
}
```

## 🗄️ Esquema de Base de Datos

### Módulos Principales

#### 🔐 **Usuarios y Autenticación**
- `users` - Información de usuarios (id, username, email, password, deviceInfo, isActive, deviceConfigured)
- `roles` - Roles del sistema (admin|fiscalizador)
- `user_roles` - Relación usuarios-roles

#### 🚗 **Vehículos y Propietarios**
- `vehicle_types` - Tipos de vehículos (Mototaxi, Automóvil, Camión, Bus)
- `vehicles` - Registro de vehículos (plate_number, company_ruc, owner_dni, type_id, vehicle_status, brand, model)
- `owners` - Propietarios (dni, first_name, last_name, phone, email)

#### 🏢 **Empresas**
- `companies` - Empresas de transporte (ruc, name, address, registration_date, expiration_date, ruc_status)

#### 👤 **Conductores y Licencias**
- `drivers` - Información de conductores (dni, first_name, last_name, phone_number, address, photo_url)
- `driving_licenses` - Licencias de conducir (license_id, driver_dni, license_number, category, issue_date, expiration_date, restrictions)

#### 📋 **Documentación Vehicular**
- `technical_reviews` - Revisiones técnicas (review_id, vehicle_plate, issue_date, expiration_date, inspection_result)
- `insurances` - Seguros SOAT/AFOCAT (id, policy_number, vehicle_plate, start_date, expiration_date, license_id, owner_dni)

#### 🔍 **Fiscalización**
- `control_records` - Registros de control (id, seatbelt, cleanliness, tires, first_aid_kit, fire_extinguisher, lights)
- `compliant_records` - Actas conformes
- `non_compliant_records` - Actas no conformes  
- `violations` - Catálogo de infracciones (code, description, severity, uit_percentage, administrative_measure)
- `record_violations` - Infracciones por acta

#### 📸 **Multimedia**
- `photos` - Fotografías con coordenadas GPS (id, user_id, coordinates, url, capture_date)
- `record_photos` - Relación actas-fotos

## 🛠️ Stack Tecnológico

### Dependencias Principales
```json
{
  "bcrypt": "^5.1.1",
  "cookie-parser": "^1.4.7", 
  "cors": "^2.8.5",
  "dotenv": "^16.5.0",
  "express": "^5.1.0",
  "express-rate-limit": "^7.5.0",
  "express-validator": "^7.2.1",
  "helmet": "^8.1.0",
  "jsonwebtoken": "^9.0.2",
  "mysql2": "^3.14.1",
  "sequelize": "^6.37.7"
}
```

## 🔧 Scripts Disponibles

```bash
# Iniciar servidor
npm start

# Instalar dependencias  
npm run build

# Base de datos
npm run seed              # Ejecutar seeders
npm run seed:down         # Revertir seeders

# Testing
npm test                  # Por implementar
```

## 🌍 Despliegue

### Variables de Entorno Producción

Cambiar `NODE_ENV=production` y configurar las variables de base de datos según el proveedor de hosting.

## 🔗 Integración

### Joya Express
La API está diseñada para compartir datos con el aplicativo Joya Express:
- Registro de motos/conductores
- Consulta de información vehicular

### Documentación Técnica
Las operaciones de campo incluyen:
- Verificación de documentos (SOAT, licencias, AFOCAT, revisión técnica, TUC(E))
- Clasificación de infracciones (Muy Grave, Grave, Leve)
- Generación de actas con QR para seguimiento
- Toma de evidencias (máximo 8 fotos con metadatos GPS)

## 🚨 Consideraciones Importantes

- **Rate Limiting**: Limitación en endpoints de autenticación
- **Geolocalización**: Coordenadas GPS obligatorias para actas
- **Formato Imágenes**: Conversión automática a WebP
- **Control de Dispositivos**: Un dispositivo autorizado por fiscalizador
- **Seguridad**: Validación estricta de credenciales y dispositivos

## 📝 Licencia

Este proyecto está desarrollado por la Fábrica de Software - Tecsup bajo licencia ISC.

---

**FISCAMOTO** - Sistema de Fiscalización Digital para Gobiernos Locales 🚗⚡