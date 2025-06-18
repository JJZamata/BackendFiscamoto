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
                is: /^[A-Z0-9]+$/
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
            type: Sequelize.DECIMAL(5, 2),
            allowNull: false,
            field: 'uit_percentage',
            validate: {
                min: 0,
                max: 999.99,
                isDecimal: true
            }
        },
        administrativeMeasure: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'administrative_measure',
            validate: {
                notEmpty: true
            }
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