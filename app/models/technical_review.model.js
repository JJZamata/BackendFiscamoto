export default (sequelize, Sequelize) => {
    const TechnicalReview = sequelize.define("technical_reviews", {
        reviewId: {
            type: Sequelize.STRING(30),
            primaryKey: true,
            allowNull: false,
            field: 'review_id',
            validate: {
                len: [10, 30],
                notEmpty: true
            },
            comment: 'ID único de la revisión técnica'
        },
        vehiclePlate: {
            type: Sequelize.STRING(10),
            allowNull: false,
            field: 'vehicle_plate',
            references: {
                model: 'vehicles',
                key: 'plate_number'
            },
            validate: {
                len: [6, 10],
                is: /^[A-Z0-9]+$/
            }
        },
        issueDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            field: 'issue_date'
        },
        expirationDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            field: 'expiration_date',
            validate: {
                isAfterIssueDate(value) {
                    if (value <= this.issueDate) {
                        throw new Error('La fecha de vencimiento debe ser posterior a la fecha de emisión');
                    }
                }
            }
        },
        inspectionResult: {
            type: Sequelize.ENUM('APROBADO', 'OBSERVADO'),
            allowNull: false,
            field: 'inspection_result',
            validate: {
                notEmpty: true
            }
        },
        certifyingCompany: {
            type: Sequelize.TEXT,
            allowNull: false,
            field: 'certifying_company',
            validate: {
                notEmpty: true
            }
        }
    }, {
        tableName: 'technical_reviews',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['review_id']
            },
            {
                fields: ['vehicle_plate']
            },
            {
                fields: ['expiration_date']
            },
            {
                fields: ['inspection_result']
            }
        ],
        getterMethods: {
            isExpired() {
                return new Date() > this.expirationDate;
            },
            daysUntilExpiration() {
                const today = new Date();
                const expDate = new Date(this.expirationDate);
                const diffTime = expDate - today;
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            },
            isApproved() {
                return this.inspectionResult === 'APROBADO';
            }
        }
    });

    return TechnicalReview;
};