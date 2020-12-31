import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import {
  Inject,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Logger } from 'winston';
import { Socket, Server } from 'ws';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Perms } from '@server/user/perm.decorator';
import { PermGuard } from '@server/user/perm.guard';
import { UserService } from '@server/user/services/user.service';
import { WsExceptionFilter } from '@server/error/wsError.filter';
import { CommentDTO } from '@dtos/task.dto';
import { CommentService } from '../services/comment.service';


@UseFilters(WsExceptionFilter)
@UseGuards(PermGuard)
@WebSocketGateway()
export class CommentGateway implements OnGatewayConnection {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private userService: UserService,
    private commentService: CommentService,
  ) {}
  @WebSocketServer() server: Server;

  @Perms('common.task.talk')
  @SubscribeMessage('comment')
  async comment(@ConnectedSocket() client: Socket, @MessageBody() data: CommentDTO) {
    await this.commentService.comment(data.taskId, client['currentUser'].id, {
      content: data.content,
      type: data.type,
    });
  }

  async handleConnection(@ConnectedSocket() client: Socket, @MessageBody() data: unknown) {
    // @ts-ignore
    const params = new URLSearchParams(data.url.split('?')[1]);
    if (params.get('target') === 'discuss') {
      this.commentService.join(params.get('taskId'), client);
    }
  }
}
