export default (sequelize, Sequelize) => {
    const ControlRecord = sequelize.define("control_records", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        seatbelt: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            comment: 'Cinturón de seguridad'
        },
        cleanliness: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            comment: 'Estado de limpieza del vehículo'
        },
        tires: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            comment: 'Estado de los neumáticos'
        },
        firstAidKit: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            field: 'first_aid_kit',
            comment: 'Presencia de botiquín'
        },
        fireExtinguisher: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            field: 'fire_extinguisher',
            comment: 'Presencia de extintor'
        },
        lights: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            comment: 'Estado de las luces'
        }
    }, {
        tableName: 'control_records',
        timestamps: true,
        getterMethods: {
            complianceScore() {
                const items = [
                    this.seatbelt,
                    this.cleanliness,
                    this.tires,
                    this.firstAidKit,
                    this.fireExtinguisher,
                    this.lights
                ];
                const compliantItems = items.filter(item => item === true).length;
                return (compliantItems / items.length) * 100;
            },
            isFullyCompliant() {
                return this.complianceScore() === 100;
            },
            nonCompliantItems() {
                const items = [];
                if (!this.seatbelt) items.push('Cinturón de seguridad');
                if (!this.cleanliness) items.push('Limpieza');
                if (!this.tires) items.push('Neumáticos');
                if (!this.firstAidKit) items.push('Botiquín');
                if (!this.fireExtinguisher) items.push('Extintor');
                if (!this.lights) items.push('Luces');
                return items;
            }
        }
    });

    return ControlRecord;
};