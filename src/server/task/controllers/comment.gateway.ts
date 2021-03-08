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
import { Access } from '@server/user/access.decorator';
import { RoleAccessGuard } from '@server/user/roleAccess.guard';
import { UserService } from '@server/user/services/user.service';
import { WsExceptionFilter } from '@server/error/wsError.filter';
import { CommentService } from '../services/comment.service';
import { CommentDTO } from '@dtos/comment.dto';


@UseFilters(WsExceptionFilter)
@UseGuards(RoleAccessGuard)
@WebSocketGateway()
export class CommentGateway implements OnGatewayConnection {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private userService: UserService,
    private commentService: CommentService,
  ) {}
  @WebSocketServer() server: Server;

  @Access('common.task.edit')
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
