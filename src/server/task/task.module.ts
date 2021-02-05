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
@Module({
  imports: [CommonModule, forwardRef(() => UserModule)],
  providers: [TaskService, SpaceService, CommentGateway, CommentService, YjsGateway, YjsService],
  controllers: [TaskController, SpaceController],
  exports: [TaskService, SpaceService],
})
export class TaskModule {}
