import { NestFactory } from '@nestjs/core';
import { DatabaseModule } from '@server/database/database.module';
import { DatabaseService } from '@server/database/database.service';

async function initDb() {
  const contrainer = await NestFactory.create(DatabaseModule, {
    // logger: false,
  });
  const databaseService = contrainer.get(DatabaseService);
  console.log('Dropping tables...');
  await databaseService.clear();

  console.log('Creating default content...');
  await databaseService.addDefault();

  console.log('Database initilization completed.');
}
initDb()
  .catch((err) => console.log(err))
  .finally(() => process.exit(0));
