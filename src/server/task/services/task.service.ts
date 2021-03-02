import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Brackets, EntityManager, SelectQueryBuilder } from "typeorm";
import { User } from "@server/user/entities/user.entity";
import { UserService } from "@server/user/services/user.service";
import { Task, Content, TaskState } from "../entities/task.entity";
import { OutputData } from "@editorjs/editorjs";
import { AccessLevel, Role, Space } from "../entities/space.entity";
import { unionArrays } from "@utils/utils";
import { ConfigService } from "@nestjs/config";
import { SpaceService } from "./space.service";
import { Comment } from "../entities/comment.entity";
import { DateRange } from "@dtos/misc.dto";
import moment from "moment";

@Injectable()
export class TaskService {
  taskQuery: SelectQueryBuilder<Task>;
  commentQuery: SelectQueryBuilder<Comment>;
  constructor(
    private userService: UserService,
    private spaceService: SpaceService,
    private configService: ConfigService,
    private manager: EntityManager
  ) {
    this.taskQuery = this.manager
      .createQueryBuilder(Task, "task")
      .leftJoinAndSelect("task.assignments", "assignment")
      .leftJoinAndSelect("assignment.members", "member")
      .leftJoinAndSelect("assignment.role", "role")
      .leftJoinAndSelect("member.user", "user")
      .leftJoinAndSelect("task.space", "space")
      .leftJoinAndSelect("space.roles", "sRole")
      .leftJoinAndSelect("task.contents", "content")
      .leftJoinAndSelect("task.superTask", "superTask")
      .leftJoinAndSelect("task.subTasks", "subTask");

    this.commentQuery = this.manager
      .createQueryBuilder(Comment, "comment")
      .leftJoinAndSelect("comment.sender", "sender")
      .leftJoinAndSelect("comment.task", "task");
  }

  async checkParentTaskNotInStates(task: Task | number, states: TaskState[]) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    let superTask = task.superTask;
    if (superTask) {
      if (!states.includes(superTask.state))
        throw new ForbiddenException(
          `Parent task is restricted, forbidden action.`
        );
      this.checkParentTaskNotInStates(superTask, states);
    }
  }

  async addTask(
    space: Space | number,
    name: string,
    executor?: User | number,
    options: {
      admins?: User[] | number[];
      state?: TaskState;
      access?: AccessLevel;
    } = {}
  ) {
    space =
      space instanceof Space ? space : await this.spaceService.getSpace(space);
    let task = new Task();
    task.space = space;
    task.name = name;
    if (options.access) task.access = options.access;
    if (options.state) task.state = options.state;
    task = await this.manager.save(task);
    //log
    if (options.admins) {
      const adminMembers = [];
      for (const admin of options.admins) {
        adminMembers.push(await this.spaceService.addMember(space, admin));
      }
      await this.spaceService.addAssignment(
        task,
        options.admins,
        "admin",
        AccessLevel.FULL
      );
    }
    return await this.getTask(task.id);
  }

  async addSubTask(
    task: Task | number,
    name: string,
    executor?: User | number,
    options: {
      state?: TaskState;
    } = {}
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (
      task.state === TaskState.UNCONFIRMED ||
      task.state === TaskState.COMPLETED
    )
      throw new ForbiddenException(
        "Task is freezed (completed or unconfirmed), \
        forbidden subtask creation."
      );

    await this.checkParentTaskNotInStates(task, [
      TaskState.SUSPENDED,
      TaskState.IN_PROGRESS,
    ]);

    const subTask = await this.addTask(task.space, name, executor, options);
    subTask.superTask = task;
    await this.manager.save(subTask);
    // TODO: closure-table does not update when compounent'parent update yet. so we update it maunaly.
    // await this.manager.query(
    //   `UPDATE task_closure SET id_ancestor = ${task.id} WHERE id_descendant = ${subTask.id}`,
    // );
    return await this.getTask(task.id);
  }

  async getTaskAccess(task: Task | number, user: User | number) {
    task = task instanceof Task ? task : await this.getTask(task);

    // 1. cheack if is space member
    if (!(await this.spaceService.getMember(task.space, user))) return [];

    // 2. cheack if is scope admin
    if (await this.spaceService.isScopeAdmin(task, user)) return ["common.*"];

    // 3. cheack all assignments of task and task default access
    const assignments = await this.spaceService.getAssignments(task, user);
    let access = this.configService.get("taskAccess")[task.access];
    assignments.forEach(
      (a) =>
        (access = access.concat(
          this.configService.get("taskAccess")[a.role.access]
        ))
    );

    return unionArrays(access);
  }

  async getTask(id: number, exception = true) {
    const query = this.taskQuery.clone().where("task.id = :id", { id });
    const task = await query.getOne();
    if (!task && exception) throw new NotFoundException("Task was not found.");
    return task;
  }

  async getComment(id: number, exception = true) {
    const query = this.commentQuery.clone().where("comment.id = :id", { id });
    const comment = await query.getOne();
    if (!comment && exception)
      throw new NotFoundException("Comment was not found.");
    return comment;
  }

  async getCommentIndex(comment: Comment | number) {
    comment =
      comment instanceof Comment ? comment : await this.getComment(comment);

    let query = this.commentQuery.clone();
    query = query.andWhere("task.id = :taskId", { taskId: comment.task.id });
    query = query.orderBy("comment.id", "ASC");
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
    } = {}
  ) {
    let query = this.commentQuery.clone();
    let taskCommentIds = [];
    if (options.task) {
      const taskId = await this.getTaskId(options.task);
      query = query.andWhere("task.id = :taskId", { taskId });
      taskCommentIds = (await query.getMany()).map((comment) => {
        return comment.id;
      });
    }

    if (options.user) {
      const userId = await this.userService.getUserId(options.user);
      query = query.andWhere("sender.id = :userId", { userId });
    }

    if (options.dateAfter) {
      const after = options.dateAfter;
      query = query.andWhere("comment.createAt >= :after", { after });
    }

    if (options.dateBefore) {
      const before = options.dateBefore;
      query = query.andWhere("comment.createAt < :before", { before });
    }

    query = query.orderBy("comment.id", "ASC");

    if (!options.skip || !options.take) {
      query = query
        .skip((options.current - 1) * options.pageSize || 0)
        .take(options.pageSize || 5);
    }

    if (options.skip !== undefined && options.take) {
      query = query.skip(options.skip).take(options.take);
    }
    const commentsList = await query.getManyAndCount();
    if (taskCommentIds) {
      const comments = commentsList[0].map((comment) => {
        comment["index"] = taskCommentIds.indexOf(comment.id);
        return comment;
      });
      commentsList[0] = comments;
    }
    return commentsList;
  }

  async getTasks(
    options: {
      space?: Space | number;
      user?: User | number;
      superTask?: Task | number;
      roles?: { role: Role | number; user: User | number }[];
      name?: string;
      state?: TaskState[] | TaskState;
      dueAfter?: Date;
      dueBefore?: Date;
      pageSize?: number;
      current?: number;
      skip?: number;
      take?: number;
    } = {}
  ) {
    let query = this.taskQuery.clone();

    if (options.space) {
      const spaceId = await this.spaceService.getSpaceId(options.space);
      query = query.andWhere("space.id = :spaceId", { spaceId });
    }
    if (options.user) {
      const userId = await this.userService.getUserId(options.user);
      query = query.andWhere(
        new Brackets((qb) => {
          qb.where("user.id = :userId", { userId })
            .orWhere("space.access IS NOT NULL")
            .orWhere("task.access IS NOT NULL");
        })
      );
    }

    if (options.roles) {
      for (const role of options.roles) {
        const userId = await this.userService.getUserId(role.user);
        const roleId = await this.spaceService.getRoleId(role.role);
        query = query
          .andWhere("user.id = :userId", { userId })
          .andWhere("role.id = :roleId", { roleId });
      }
    }

    if (options.superTask) {
      const superTaskId = await this.getTaskId(options.superTask);
      query = query.andWhere("superTask.id = :superTaskId", { superTaskId });
    }

    if (options.name) {
      query = query.andWhere("task.name LIKE :name", {
        name: `%${options.name}%`,
      });
    }

    if (options.state) {
      query = query.andWhere("task.state IN (:...states)", {
        states: unionArrays([options.state]),
      });
    }

    if (options.dueAfter) {
      const after = options.dueAfter;
      query = query.andWhere("task.dueAt >= :after", { after });
    }

    if (options.dueBefore) {
      const before = options.dueBefore;
      query = query.andWhere("task.dueAt < :before", { before });
    }

    query = query
      .leftJoinAndSelect("task.assignments", "_assignment")
      .leftJoinAndSelect("_assignment.members", "_member")
      .leftJoinAndSelect("_member.user", "_user")
      .leftJoinAndSelect("_assignment.role", "_role");

    query = query.orderBy("task.id", "DESC");

    if (!options.skip || !options.take) {
      query = query
        .skip((options.current - 1) * options.pageSize || 0)
        .take(options.pageSize || 5);
    }

    if (options.skip !== undefined && options.take) {
      query = query.skip(options.skip).take(options.take);
    }

    return await query.getManyAndCount();
  }

  async getTaskId(task: Task | number) {
    return task instanceof Task ? task.id : task;
  }

  async getCommentId(comment: Comment | number) {
    return comment instanceof Comment ? comment.id : comment;
  }

  async changeTaskState(
    task: Task | number,
    state: TaskState,
    executor?: User | number
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    if (state === TaskState.COMPLETED) this.completeSubTask(task, executor);
    task.state = state;

    await this.manager.save(task);
    return await this.getTask(task.id);
  }

  async changeTask(
    task: Task | number,
    executor?: User | number,
    option: {
      name?: string;
      state?: TaskState;
      access?: AccessLevel;
      beginAt?: Date;
      dueAt?: Date;
    } = {}
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);

    if (option.name) task.name = option.name;
    if (option.access !== undefined) task.access = option.access;
    if (option.beginAt !== undefined) task.beginAt = option.beginAt;
    if (option.dueAt !== undefined) task.dueAt = option.dueAt;

    await this.manager.save(task);
    return await this.getTask(task.id);
  }

  async completeSubTask(task: Task | number, executor?: User | number) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (!task.subTasks) return;
    for (const subTask of task.subTasks) {
      await this.completeSubTask(subTask, executor);
      subTask.state = TaskState.COMPLETED;
      await this.manager.save(subTask);
    }
  }

  async changeTaskContent(
    task: Task | number,
    content: OutputData,
    executor?: User | number
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException(
        "Task is not in progress, forbidden suspension."
      );

    if (task.contents.length === 0) {
      const content = new Content();
      await this.manager.save(content);
      task.contents.push(content);
      await this.manager.save(task);
    }
    const lastContent = task.contents[task.contents.length - 1];
    lastContent.content = content;
    await this.manager.save(lastContent);
    return await this.getTask(task.id);
  }

  async commitOnTask(task: Task | number, executor?: User | number) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException(
        "Task is not in progress, forbidden submittion."
      );
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.UNCONFIRMED;
    await this.manager.save(task);
    // await this.addLog(task, LogAction.COMMIT, executor);
    return await this.getTask(task.id);
  }

  async refuseToCommit(task: Task | number, executor?: User | number) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.UNCONFIRMED)
      throw new ForbiddenException(
        "Task does not wait for comfirmtion, forbidden response."
      );

    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.IN_PROGRESS;
    await this.manager.save(task);
    // await this.addLog(task, LogAction.REFUSE, executor);
    if (task.contents.length > 0) {
      let cloneContent = new Content();
      cloneContent.content = task.contents[task.contents.length - 1].content;
      cloneContent.task = task;
      cloneContent = await this.manager.save(cloneContent);
    }
    return await this.getTask(task.id);
  }
}
