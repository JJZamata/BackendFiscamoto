'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Conductors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING
      },
      dni: {
        type: Sequelize.STRING
      },
      licencia: {
        type: Sequelize.STRING
      },
      estadoLicencia: {
        type: Sequelize.STRING
      },
      vehiculoAsignado: {
        type: Sequelize.STRING
      },
      estadoGeneral: {
        type: Sequelize.STRING
      },
      codigo: {
        type: Sequelize.STRING
      },
      foto: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Conductors');
  }
};