import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager, In, IsNull, Not } from 'typeorm';
import { GetTasksDTO, CommentDTO, CommentRes } from '@dtos/task.dto';
import { isUserArray } from '@utils/typeGuard';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { Task, TaskState } from '../entities/task.entity';
import { OutputData } from '@editorjs/editorjs';
import { TaskService } from './task.service';
import { serialize } from 'class-transformer';
import { Socket, Server } from 'ws';
import { WebSocketServer } from '@nestjs/websockets';
import { CommentType, Comment } from '../entities/comment.entity';

const taskRooms = new Map<string, Set<Socket>>();

@Injectable()
export class CommentService {
  constructor(
    private userService: UserService,
    private taskService: TaskService,
    private manager: EntityManager,
  ) {}

  async comment(
    task: Task | number,
    sender: User | string | number,
    content: { content: string; type: CommentType },
  ) {
    task = task instanceof Task ? task : await this.taskService.getTask(task);
    sender = sender instanceof User ? sender : await this.userService.getUser(sender);
    let comment = new Comment();
    comment.task = task;
    comment.sender = sender;
    comment.content = content.content;
    comment.type = content.type;
    comment = await this.manager.save(comment);

    taskRooms
      .get(task.id.toString())
      .forEach((client) => client.send(serialize(new CommentRes(comment))));
  }

  async join(taskRoom: string, client: Socket) {
    if (!taskRoom) return;
    console.log('comment join room', taskRoom);
    if (taskRooms.has(taskRoom)) {
      taskRooms.get(taskRoom).add(client);
    } else {
      const clients = new Set([client]);
      taskRooms.set(taskRoom, clients);
    }
  }
}
