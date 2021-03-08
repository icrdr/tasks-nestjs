import { Inject, Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions, TypeOrmModule } from '@nestjs/typeorm';
import { configModule } from '../config/config.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { DatabaseService } from './database.service';
import { UserService } from '../user/services/user.service';
import { OptionService } from '../option/option.service';
import { join } from 'path';
import { SpaceService } from '../task/services/space.service';
import { TaskService } from '../task/services/task.service';
import { AssignmentService } from '../task/services/assignment.service';
import { MemberService } from '../task/services/member.service';
import { RoleService } from '../task/services/role.service';
import { PropertyService } from '../task/services/property.service';

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
  providers: [
    DatabaseService,
    OptionService,
    UserService,
    SpaceService,
    TaskService,
    AssignmentService,
    PropertyService,
    MemberService,
    RoleService,
  ],
})
export class DatabaseModule {}
