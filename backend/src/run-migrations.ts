import { AppDataSource } from './data-source';

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Data source initialized');

    const pending = await AppDataSource.showMigrations();
    console.log('Pending migrations:', pending);

    await AppDataSource.runMigrations();
    console.log('✅ Migrations executed successfully');
  } catch (err) {
    console.error('❌ Error running migrations', err);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

runMigrations();

