import { Injectable, Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import {
  TypeOrmOptionsFactory,
  TypeOrmModuleOptions,
  TypeOrmModule,
} from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import path from 'path'

@Injectable()
class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.configService.get('dbHost'),
      port: 3306,
      username: this.configService.get('dbUsername'),
      password: this.configService.get('dbPassword'),
      database: this.configService.get('dbDatabase'),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: true,
    };
  }
}
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),
  ],
})
export class DatabaseModule {}
