import configuration  from '../../../.servec';
import { ConfigModule } from '@nestjs/config';

export const configModule = ConfigModule.forRoot({
    envFilePath: '.env',
    load: [configuration],
    isGlobal: true,
  });
