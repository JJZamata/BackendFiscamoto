'use strict';

const { faker } = require('@faker-js/faker');

/** @type {import('sequelize').Seeder} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const conductores = [];

    for (let i = 1; i <= 50; i++) {
      conductores.push({
        nombre: faker.person.fullName(),
        dni: faker.number.int({ min: 10000000, max: 99999999 }).toString(),
        licencia: `Q${faker.number.int({ min: 1000000, max: 9999999 })} (B-IIb)`,
        estadoLicencia: faker.helpers.arrayElement(['Vigente', 'Vencida', 'Suspendida']),
        vehiculoAsignado: `${faker.string.alpha({ length: 3 }).toUpperCase()}-${faker.number.int({ min: 100, max: 999 })}`,
        estadoGeneral: faker.helpers.arrayElement(['Habilitado', 'Inhabilitado']),
        codigo: `COND-${i.toString().padStart(3, '0')}`,
        foto: `https://randomuser.me/api/portraits/men/${i % 100}.jpg`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Conductors', conductores, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Conductors', null, {});
  }
};
