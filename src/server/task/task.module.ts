import { forwardRef, Module } from '@nestjs/common';
import { TaskService } from './services/task.service';
import { SpaceTaskController, TaskController } from './controllers/task.controller';
import { CommonModule } from '../common/common.module';
import { UserModule } from '../user/user.module';
import { YjsGateway } from './controllers/yjs.gateway';
import { YjsService } from './services/yjs.service';
import { CommentGateway } from './controllers/comment.gateway';
import { CommentService } from './services/comment.service';
import { SpaceService } from './services/space.service';
import { SpaceController } from './controllers/space.controller';
import { AssetService } from './services/asset.service';
import { BullModule } from '@nestjs/bull';
import { AssetProcessor } from './services/asset.processor';
import { PropertyService } from './services/property.service';
import { SpaceAssetController, TaskAssetController } from './controllers/asset.controller';
import { RoleController } from './controllers/role.controller';
import { MemberController } from './controllers/member.controller';
import {
  SpaceAssignmentController,
  TaskAssignmentController,
} from './controllers/assignment.controller';
import { GroupController } from './controllers/group.controller';
import { AssignmentService } from './services/assignment.service';
import { MemberService } from './services/member.service';
import { RoleService } from './services/role.service';
import { PropertyController } from './controllers/property.controller';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => UserModule),
    BullModule.registerQueue({
      name: 'asset',
    }),
  ],
  providers: [
    TaskService,
    PropertyService,
    SpaceService,
    PropertyService,
    AssignmentService,
    MemberService,
    RoleService,
    AssetService,
    CommentGateway,
    CommentService,
    YjsGateway,
    YjsService,
    AssetService,
    AssetProcessor,
  ],
  controllers: [
    TaskController,
    SpaceController,
    TaskAssetController,
    SpaceAssetController,
    SpaceTaskController,
    PropertyController,
    RoleController,
    MemberController,
    SpaceAssignmentController,
    TaskAssignmentController,
    GroupController,
  ],
  exports: [TaskService, SpaceService, AssetService],
})
export class TaskModule {}
