import configuration  from '../configuration';
import { ConfigModule } from '@nestjs/config';

export const configModule = ConfigModule.forRoot({
    envFilePath: '.env',
    load: [configuration],
    isGlobal: true,
  });
