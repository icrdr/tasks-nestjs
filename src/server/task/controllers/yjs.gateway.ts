import {
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
import { YjsService } from '../services/yjs.service';
import { AccessGuard } from '@server/user/access.guard';

import { WsExceptionFilter } from '@server/error/wsError.filter';


@UseFilters(WsExceptionFilter)
@UseGuards(AccessGuard)
@WebSocketGateway()
export class YjsGateway implements OnGatewayConnection {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private yjsService: YjsService,
  ) {}
  @WebSocketServer() server: Server;

  // TODO: WebSocketGateway global decorator don't effect handleConnection
  async handleConnection(@ConnectedSocket() client: Socket, @MessageBody() data: unknown) {
    // @ts-ignore
    const params = new URLSearchParams(data.url.split('?')[1]);
    if (params.get('target') === 'editorjs') {
      this.yjsService.setupWSConnection(client, data);
    }
  }
}
