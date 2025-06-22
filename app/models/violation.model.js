//violations.model.js
export default (sequelize, Sequelize) => {
    const Violation = sequelize.define("violations", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        code: {
            type: Sequelize.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 10],
                is: /^[A-Z0-9.]+$/ // Ahora permite puntos (para "M.1")
            }
            },
        description: {
            type: Sequelize.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        severity: {
            type: Sequelize.ENUM('very_serious', 'serious', 'minor'),
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        uitPercentage: {
            type: Sequelize.DECIMAL(5, 2), // Almacena 5.00 en lugar de "5%"
            allowNull: false,
            field: 'uit_percentage',
            validate: {
                min: 0,
                max: 100.00, // Ajusté el máximo a 100% ya que es porcentaje
                isDecimal: true
            },
            get() {
                // Formatea automáticamente al obtener el valor
                const value = this.getDataValue('uitPercentage');
                return `${value}%`;
            },
            set(value) {
                // Acepta tanto "5%" como 5 y lo convierte a decimal
                const numericValue = typeof value === 'string' 
                ? parseFloat(value.replace('%', '')) 
                : value;
                this.setDataValue('uitPercentage', numericValue);
            }
        },
        administrativeMeasure: {
            type: Sequelize.TEXT,
            allowNull: true, // Cambiado a true para permitir null (cuando es "—")
            field: 'administrative_measure',
            defaultValue: null // Opcional: explícitamente permitir null
        },
        target: {
            type: Sequelize.ENUM('driver-owner', 'company'), // Nuevo campo
            allowNull: false,
            defaultValue: 'driver-owner', // Para mantener compatibilidad
            comment: 'driver: conductor/propietario, company: persona jurídica'
        }
    }, {
        tableName: 'violations',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['code']
            },
            {
                fields: ['severity']
            },
            {
                fields: ['uit_percentage']
            },
            /*/ Índice compuesto para consultas frecuentes
            {
                name: 'violations_severity_uit_idx',
                fields: ['severity', 'uit_percentage']
            }*/
        ],
        getterMethods: {
            severityLabel() {
                const labels = {
                    'very_serious': 'Muy Grave',
                    'serious': 'Grave',
                    'minor': 'Leve'
                };
                return labels[this.severity] || this.severity;
            },
            isHighSeverity() {
                return this.severity === 'very_serious';
            }
        }
    });

    return Violation;
};