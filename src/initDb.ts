import { NestFactory } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';

async function initDb() {
  const app = await NestFactory.create(DatabaseModule, {
    logger: false,
  });

  const databaseService = app.get(DatabaseService);
  await databaseService.clear();
  console.log('database cleared');
  await databaseService.createDefault();
  console.log('database updated');
}
initDb()
  .catch((err) => console.log(err))
  .finally(() => process.exit(0));
