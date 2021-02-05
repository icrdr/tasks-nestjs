import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { OptionModule } from '../option/option.module';
import { SpaceService } from '../task/services/space.service';
import { TaskModule } from '../task/task.module';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

@Module({
  imports: [CommonModule, OptionModule, forwardRef(() => TaskModule)],
  controllers: [UserController, AuthController],
  providers: [UserService, AuthService],
  exports: [UserService, AuthService],
})
export class UserModule {}
