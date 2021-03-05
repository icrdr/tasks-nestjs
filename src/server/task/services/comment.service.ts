import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CommentRes } from '@dtos/task.dto';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { Task } from '../entities/task.entity';
import { TaskService } from './task.service';
import { serialize } from 'class-transformer';
import { Socket } from 'ws';
import { Comment } from '../entities/comment.entity';
import { CommentType } from '../../common/common.entity';

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
    sender: User | number,
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
