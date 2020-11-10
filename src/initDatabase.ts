import { NestFactory } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';

async function initDb() {
  const contrainer = await NestFactory.create(DatabaseModule, {
    logger: false,
  });
  const databaseService = contrainer.get(DatabaseService);
  console.log('Dropping tables...');
  await databaseService.clear();

  console.log('Creating default content...');
  await databaseService.createDefault();

  console.log('Database initilization completed.');
}
initDb()
  .catch((err) => console.log(err))
  .finally(() => process.exit(0));
