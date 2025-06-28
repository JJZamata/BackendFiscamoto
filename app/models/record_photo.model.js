export default (sequelize, Sequelize) => {
    const { Op } = Sequelize; // ✅ Para usar operadores en índices condicionales

    const RecordPhoto = sequelize.define("record_photos", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        compliantRecordId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            field: 'compliant_record_id',
            references: {
                model: 'compliant_records',
                key: 'id'
            },
            validate: {
                isInt: true,
                min: 1
            }
        },
        nonCompliantRecordId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            field: 'non_compliant_record_id',
            references: {
                model: 'non_compliant_records',
                key: 'id'
            },
            validate: {
                isInt: true,
                min: 1
            }
        },
        photoId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'photo_id',
            validate: {
                isInt: true,
                min: 1
            }
        }
    }, {
        tableName: 'record_photos',
        timestamps: true,
        indexes: [
            // ✔️ Unicidad por acta conforme
            {
                unique: true,
                fields: ['compliant_record_id', 'photo_id'],
                where: {
                    compliant_record_id: { [Op.ne]: null }
                }
            },
            // ✔️ Unicidad por acta no conforme
            {
                unique: true,
                fields: ['non_compliant_record_id', 'photo_id'],
                where: {
                    non_compliant_record_id: { [Op.ne]: null }
                }
            },
            // Index simples
            { fields: ['compliant_record_id'] },
            { fields: ['non_compliant_record_id'] },
            { fields: ['photo_id'] }
        ],
        validate: {
            // ✔️ Validación a nivel de modelo
            exactlyOneRecord() {
                const hasCompliant = this.compliantRecordId !== null && this.compliantRecordId !== undefined;
                const hasNonCompliant = this.nonCompliantRecordId !== null && this.nonCompliantRecordId !== undefined;

                if (hasCompliant && hasNonCompliant) {
                    throw new Error('Una foto no puede estar asociada a ambos tipos de acta');
                }

                if (!hasCompliant && !hasNonCompliant) {
                    throw new Error('Una foto debe estar asociada a al menos un tipo de acta');
                }
            }
        }
    });

    return RecordPhoto;
};
