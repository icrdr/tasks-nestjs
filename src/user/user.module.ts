import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { OptionModule } from 'src/option/option.module';
import { AuthController } from './controllers/auth.controller';
import { RoleController } from './controllers/role.controller';
import { UserController } from './controllers/user.controller';
import { Perm, Role, User } from './entities/user.entity';
import { AuthService } from './services/auth.service';
import { RoleService } from './services/role.service';
import { UserService } from './services/user.service';

@Module({
  imports: [
    CommonModule,
    OptionModule,
  ],
  controllers: [UserController, RoleController, AuthController],
  providers: [UserService, RoleService, AuthService],
})
export class UserModule {}
