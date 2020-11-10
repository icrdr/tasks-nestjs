import { NestFactory } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';

async function initDb() {
  const app = await NestFactory.create(DatabaseModule, {
    logger: false,
  });
  const databaseService = app.get(DatabaseService);
  console.log('Dropping tables...');
  await databaseService.clear();

  console.log('Creating default content...');
  await databaseService.createDefault();

  console.log('Database initilization completed.');
}
initDb()
  .catch((err) => console.log(err))
  .finally(() => process.exit(0));
