import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { OptionModule } from './option/option.module';
import { ConfigModule} from '@nestjs/config';
import { DatabaseModule } from './database.module';
import { CommonModule } from './common/common.module';
import config from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [config],
      isGlobal: true,
    }),
    DatabaseModule,
    UserModule,
    OptionModule,
    CommonModule,
  ],
})
export class AppModule {}
