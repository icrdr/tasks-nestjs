import { Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { TaskController } from "./task.controller";
import { CommonModule } from "../common/common.module";
import { UserModule } from "../user/user.module";
import { YjsGateway } from "./yjs.gateway";

@Module({
  imports: [CommonModule, UserModule],
  providers: [TaskService, YjsGateway],
  controllers: [TaskController],
})
export class TaskModule {}
