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
import { setupWSConnection } from "./yjs.utils";

@WebSocketGateway()
export class YjsGateway implements OnGatewayConnection {
  // constructor(
  //   @Inject(WINSTON_MODULE_PROVIDER)
  //   private readonly logger: Logger
  // ) {}
  @WebSocketServer() server: Server;

  public handleConnection(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown
  ): void {
    setupWSConnection(client, data);
  }
}
