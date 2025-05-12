import { up as rolesUp, down as rolesDown } from './20240318000000-roles.js';

const seeders = [
  {
    name: 'roles',
    up: rolesUp,
    down: rolesDown
  }
];

export const runSeeders = async () => {
  try {
    console.log('Iniciando ejecución de seeders...');
    
    for (const seeder of seeders) {
      console.log(`Ejecutando seeder: ${seeder.name}`);
      await seeder.up();
    }
    
    console.log('Todos los seeders se ejecutaron exitosamente');
  } catch (error) {
    console.error('Error al ejecutar los seeders:', error);
    throw error;
  }
};

export const revertSeeders = async () => {
  try {
    console.log('Iniciando reversión de seeders...');
    
    // Revertir en orden inverso
    for (const seeder of [...seeders].reverse()) {
      console.log(`Revirtiendo seeder: ${seeder.name}`);
      await seeder.down();
    }
    
    console.log('Todos los seeders se revirtieron exitosamente');
  } catch (error) {
    console.error('Error al revertir los seeders:', error);
    throw error;
  }
};

// Si se ejecuta directamente este archivo
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'up') {
    runSeeders()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'down') {
    revertSeeders()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Uso: node seeders/index.js [up|down]');
    process.exit(1);
  }
} 