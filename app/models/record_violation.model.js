// models/record_violation.model.js
export default (sequelize, Sequelize) => {
    const RecordViolation = sequelize.define("record_violations", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nonCompliantRecordId: {
            type: Sequelize.INTEGER,
            allowNull: false,
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
        violationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'violation_id',
            references: {
                model: 'violations',
                key: 'id'
            },
            validate: {
                isInt: true,
                min: 1
            }
        }
    }, {
        tableName: 'record_violations',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['non_compliant_record_id', 'violation_id']
            },
            {
                fields: ['non_compliant_record_id']
            },
            {
                fields: ['violation_id']
            }
        ]
    });

    return RecordViolation;
};