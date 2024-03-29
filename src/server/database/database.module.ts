import { Inject, Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TypeOrmOptionsFactory,
  TypeOrmModuleOptions,
  TypeOrmModule,
} from '@nestjs/typeorm';
import { configModule } from '../config/config.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { DatabaseService } from './database.service';
import { UserService } from '../user/services/user.service';
import { OptionService } from '../option/option.service';
import { RoleService } from '../user/services/role.service';
import { join } from 'path';

@Injectable()
class TypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject()
  private configService: ConfigService;

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.configService.get('dbHost'),
      port: 3306,
      username: this.configService.get('dbUsername'),
      password: this.configService.get('dbPassword'),
      database: this.configService.get('dbDatabase'),
      entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: true,
    };
  }
}

@Module({
  imports: [
    configModule,
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
  ],
  providers: [DatabaseService, OptionService, UserService, RoleService],
})
export class DatabaseModule {}
