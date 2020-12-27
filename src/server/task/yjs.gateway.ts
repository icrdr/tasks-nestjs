import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Inject, Injectable, Req } from "@nestjs/common";
import { Logger } from "winston";
import { Socket, Server } from "ws";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { YjsService } from "./yjs.service";

@WebSocketGateway()
export class YjsGateway implements OnGatewayConnection {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private yjsService: YjsService,
  ) {}
  @WebSocketServer() server: Server;

  public handleConnection(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown
  ): void {
    this.yjsService.setupWSConnection(client, data);
  }
}
