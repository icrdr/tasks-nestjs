import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { Task } from '../entities/task.entity';
import { TaskService } from './task.service';
import { serialize } from 'class-transformer';
import { Socket } from 'ws';
import { Comment } from '../entities/comment.entity';
import { CommentType } from '../../common/common.entity';
import { CommentRes } from '@dtos/comment.dto';

const taskRooms = new Map<string, Set<Socket>>();

@Injectable()
export class CommentService {
  commentQuery: SelectQueryBuilder<Comment>;
  constructor(
    private userService: UserService,
    private taskService: TaskService,
    private manager: EntityManager,
  ) {
    this.commentQuery = this.manager
      .createQueryBuilder(Comment, 'comment')
      .leftJoinAndSelect('comment.sender', 'sender')
      .leftJoinAndSelect('comment.task', 'task');
  }

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

  async getComment(id: number, exception = true) {
    const query = this.commentQuery.clone().where('comment.id = :id', { id });
    const comment = await query.getOne();
    if (!comment && exception) throw new NotFoundException('Comment was not found.');
    return comment;
  }

  async getCommentIndex(comment: Comment | number) {
    comment = comment instanceof Comment ? comment : await this.getComment(comment);

    let query = this.commentQuery.clone();
    query = query.andWhere('task.id = :taskId', { taskId: comment.task.id });
    query = query.orderBy('comment.id', 'ASC');
    const Comments = await query.getMany();
    const commentIds = Comments.map((comment) => {
      return comment.id;
    });
    const index = commentIds.indexOf(comment.id);
    return index;
  }

  async getComments(
    options: {
      user?: User | number;
      task?: Task | number;
      dateAfter?: Date;
      dateBefore?: Date;
      pageSize?: number;
      current?: number;
      skip?: number;
      take?: number;
    } = {},
  ) {
    let query = this.commentQuery.clone();
    let taskCommentIds = [];
    if (options.task) {
      const taskId = await this.taskService.getTaskId(options.task);
      query = query.andWhere('task.id = :taskId', { taskId });
      taskCommentIds = (await query.getMany()).map((comment) => {
        return comment.id;
      });
    }

    if (options.user) {
      const userId = await this.userService.getUserId(options.user);
      query = query.andWhere('sender.id = :userId', { userId });
    }

    if (options.dateAfter) {
      const after = options.dateAfter;
      query = query.andWhere('comment.createAt >= :after', { after });
    }

    if (options.dateBefore) {
      const before = options.dateBefore;
      query = query.andWhere('comment.createAt < :before', { before });
    }

    query = query.orderBy('comment.id', 'ASC');

    if (!options.skip || !options.take) {
      query = query.skip((options.current - 1) * options.pageSize || 0).take(options.pageSize || 5);
    }

    if (options.skip !== undefined && options.take) {
      query = query.skip(options.skip).take(options.take);
    }
    const commentsList = await query.getManyAndCount();
    if (taskCommentIds) {
      const comments = commentsList[0].map((comment) => {
        comment['index'] = taskCommentIds.indexOf(comment.id);
        return comment;
      });
      commentsList[0] = comments;
    }
    return commentsList;
  }
}
