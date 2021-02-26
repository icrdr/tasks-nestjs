import { forwardRef, Module } from '@nestjs/common';
import { TaskService } from './services/task.service';
import { TaskController } from './controllers/task.controller';
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
    SpaceService,
    CommentGateway,
    CommentService,
    YjsGateway,
    YjsService,
    AssetService,
    AssetProcessor,
  ],
  controllers: [TaskController, SpaceController],
  exports: [TaskService, SpaceService, AssetService],
})
export class TaskModule {}
