// models/record_photo.model.js
export default (sequelize, Sequelize) => {
    const RecordPhoto = sequelize.define("record_photos", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        controlRecordId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'control_record_id',
            references: {
                model: 'control_records',
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
            references: {
                model: 'photos',
                key: 'id'
            },
            validate: {
                isInt: true,
                min: 1
            }
        }
    }, {
        tableName: 'record_photos',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['control_record_id', 'photo_id']
            },
            {
                fields: ['control_record_id']
            },
            {
                fields: ['photo_id']
            }
        ]
    });

    return RecordPhoto;
};