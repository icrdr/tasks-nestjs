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
import { CommonModule, pathProvider } from '../common/common.module';
import { UserService } from '../user/services/user.service';
import { OptionService } from '../option/option.service';
import { RoleService } from '../user/services/role.service';
import { PlatformPath } from 'path';

@Injectable()
class TypeOrmConfigService implements TypeOrmOptionsFactory {
  @Inject()
  private configService: ConfigService;

  @Inject('PATH_LIB')
  private path: PlatformPath;

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.configService.get('dbHost'),
      port: 3306,
      username: this.configService.get('dbUsername'),
      password: this.configService.get('dbPassword'),
      database: this.configService.get('dbDatabase'),
      entities: [this.path.join(__dirname, '../**/*.entity{.ts,.js}')],
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: true,
    };
  }
}

@Module({
  imports: [
    CommonModule,
    configModule,
    TypeOrmModule.forRootAsync({
      imports: [CommonModule],
      useClass: TypeOrmConfigService,
    }),
  ],
  providers: [DatabaseService, OptionService, UserService, RoleService],
})
export class DatabaseModule {}
