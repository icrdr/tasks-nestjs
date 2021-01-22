import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, In, IsNull, Not } from 'typeorm';
import { GetTasksDTO } from '@dtos/task.dto';
import { isUserArray } from '@utils/typeGuard';
import { User } from '@server/user/entities/user.entity';
import { UserService } from '@server/user/services/user.service';
import { ActionType, Task, Content, Log, TaskState } from '../entities/task.entity';
import { OutputData } from '@editorjs/editorjs';
import { Access, AccessType, Group, Member } from '../entities/space.entity';
import { unionArrays, unionEntityArrays } from '@utils/utils';
import { utils } from 'umi';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskService {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
    private manager: EntityManager,
  ) {}

  async checkParentTaskNotInStates(task: Task | number, states: TaskState[]) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    let superTask = task.superTask;
    if (superTask) {
      if (!states.includes(superTask.state))
        throw new ForbiddenException(`Parent task is restricted, forbidden action.`);
      this.checkParentTaskNotInStates(superTask, states);
    }
  }

  async createGroup(task: Task | number, name: string, members: Member[] = []) {
    //check if task is exsited
    task = task instanceof Task ? task : await this.getTask(task, false);
    members = unionArrays(members);
    const group = new Group();
    group.task = task;
    group.name = name;
    group.members = members;
    return await this.manager.save(group);
  }

  async getGroupByName(task: Task | number, name: string) {
    const taskId = this.getTaskId(task);
    let query = this.manager
      .createQueryBuilder(Group, 'group')
      .leftJoinAndSelect('group.members', 'member')
      .leftJoinAndSelect('group.task', 'task')
      .leftJoinAndSelect('task.user', 'user')
      .where('task.id = :taskId', { taskId })
      .andWhere('group.name = :name', { name });
    const group = await query.getOne();
    return group;
  }

  async getGroupById(identify: number) {
    let query = this.manager
      .createQueryBuilder(Group, 'group')
      .leftJoinAndSelect('group.members', 'member')
      .leftJoinAndSelect('group.task', 'task')
      .leftJoinAndSelect('member.user', 'user')
      .where('group.id = :identify', { identify });
    const group = await query.getOne();
    return group;
  }

  async groupAddMember(group: Group | number, member: Member) {
    group = group instanceof Group ? group : await this.getGroupById(group);
    group.members.push(member);
    group.members = unionEntityArrays(group.members);
    return await this.manager.save(group);
  }

  async createAccess(task: Task | number, group: Group, taskAccess = AccessType.FULL) {
    //check if task is exsited
    task = task instanceof Task ? task : await this.getTask(task, false);
    const access = new Access();
    access.task = task;
    access.access = taskAccess;
    access.group = group;
    return await this.manager.save(access);
  }

  async createTask(
    name: string,
    executor?: User | number | string,
    options?: {
      adminGroups?: Group[];
      admins?: User[] | number[] | string[];
      members?: User[] | number[] | string[];
      state?: TaskState;
    },
  ) {
    let task = new Task();
    task.name = name;
    if (options.state) task.state = options.state;
    task = await this.manager.save(task);
    await this.createTaskLog(task, ActionType.CREATE, executor);

    const everyoneGroup = await this.createGroup(task, 'everyone');
    const everyoneAccess =
      options.admins || options.adminGroups ? AccessType.EDIT : AccessType.FULL;
    await this.createAccess(task, everyoneGroup, everyoneAccess);
    // task must be ready before add any member
    // FIXME: maybe use {cascade: true} to fix it
    if (options.members) {
      for (const member of options.members) {
        const userMember = await this.createMember(task, member);
        if (userMember) everyoneGroup.members.push(userMember);
      }
    }
    everyoneGroup.members = unionEntityArrays(everyoneGroup.members);
    await this.manager.save(everyoneGroup);

    if (options.adminGroups) {
      for (const adminGroup of options.adminGroups) {
        await this.createAccess(task, adminGroup, AccessType.FULL);
      }
    }

    if (options.admins) {
      const adminGroup = await this.createGroup(task, 'admin');
      await this.createAccess(task, adminGroup, AccessType.FULL);
      for (const admin of options.admins) {
        const adminMember = await this.createMember(task, admin);
        if (adminMember) everyoneGroup.members.push(adminMember);
        if (adminMember) adminGroup.members.push(adminMember);
      }
      adminGroup.members = unionEntityArrays(adminGroup.members);
      await this.manager.save(adminGroup);
    }

    return await this.getTask(task.id);
  }

  async createMember(task: Task | number, user: User | number | string) {
    //check if task and user are exsited
    task = task instanceof Task ? task : await this.getTask(task, false);
    user = user instanceof User ? user : await this.userService.getUser(user, false);
    if (!task || !user) return;
    let member = await this.getMember(task.id, user.id, false);
    if (member) return member;

    member = new Member();
    member.user = user;
    member.task = task;
    await this.manager.save(member);
    return await this.getMember(task.id, user.id, false);
  }

  async getMember(task: Task | number, user: User | number | string, exception = true) {
    const taskId = await this.getTaskId(task);
    const userId = await this.userService.getUserId(user);

    let query = this.manager
      .createQueryBuilder(Member, 'member')
      .leftJoinAndSelect('member.task', 'task')
      .leftJoinAndSelect('member.user', 'user')
      .where('task.id = :taskId', { taskId })
      .andWhere('user.id = :userId', { userId });
    const member = await query.getOne();
    if (!member && exception) throw new NotFoundException('Member was not found.');

    return member;
  }

  async getMemberAccess(task: Task | number, user: User | number | string) {
    const taskId = await this.getTaskId(task);
    const userId = await this.userService.getUserId(user);

    let query = this.manager
      .createQueryBuilder(Access, 'access')
      .leftJoinAndSelect('access.task', 'task')
      .leftJoinAndSelect('access.group', 'group')
      .leftJoinAndSelect('group.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .where('task.id = :taskId', { taskId })
      .andWhere('user.id = :userId', { userId });

    const access = await query.getMany();
    let allAccess = [];
    access.forEach(
      (a) => (allAccess = allAccess.concat(this.configService.get('taskAccess')[a.access])),
    );
    return unionArrays(allAccess);
  }

  async getTask(identify: number, exception = true) {
    let query = this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoinAndSelect('task.groups', 'group')
      .leftJoinAndSelect('group.members', 'gMember')
      .leftJoinAndSelect('gMember.user', 'gUser')
      .leftJoinAndSelect('group.task', 'gTask')
      .leftJoinAndSelect('task.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('task.contents', 'content')
      .leftJoinAndSelect('task.superTask', 'superTask')
      .leftJoinAndSelect('task.subTasks', 'subTask');
    query = query.where('task.id = :id', { id: identify });

    const task = await query.getOne();
    if (!task && exception) throw new NotFoundException('Task was not found.');

    return task;
  }

  async getTasks(options: GetTasksDTO = {}) {
    let query = this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoinAndSelect('task.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('task.contents', 'content')
      .leftJoinAndSelect('task.superTask', 'superTask');
    if (options.state) {
      query = query.where('task.state IN (:...states)', {
        states: [...options.state],
      });
    }

    query = query
      .orderBy('task.id', 'DESC')
      .skip((options.current - 1) * options.pageSize || 0)
      .take(options.pageSize || 5);

    return await query.getManyAndCount();
  }

  async getSubTasks(superTask: Task | number, options: GetTasksDTO = {}) {
    const superTaskId = superTask instanceof Task ? superTask.id : superTask;
    let query = this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoinAndSelect('task.members', 'member')
      .leftJoinAndSelect('task.contents', 'content')
      .leftJoinAndSelect('task.superTask', 'superTask');
    if (options.state) {
      query = query.where('task.state IN (:...states)', {
        states: [...options.state],
      });
    }
    query = query.andWhere('superTask.id =:id', { id: superTaskId });
    query = query
      .orderBy('task.id', 'DESC')
      .skip((options.current - 1) * options.pageSize || 0)
      .take(options.pageSize || 5);

    return await query.getManyAndCount();
  }

  async getTaskId(task: Task | number) {
    return task instanceof Task ? task.id : task;
  }

  async getTasksOfUser(
    user: User | string | number,
    options: { pageSize?: number; current?: number } = {},
  ) {
    const userId = await this.userService.getUserId(user);

    return await this.manager
      .createQueryBuilder(Task, 'task')
      .leftJoin('task.members', 'member')
      .where('member.id = :id', { id: userId })
      .skip((options.current - 1) * options.pageSize || 0)
      .take(options.pageSize || 5)
      .getMany();
  }

  async startTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.SUSPENDED)
      throw new ForbiddenException('Task is not suspended, forbidden initialization.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);

    task.state = TaskState.IN_PROGRESS;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.START, executor);

    return await this.getTask(task.id);
  }

  async restartTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.COMPLETED)
      throw new ForbiddenException('Task is not completed, forbidden initialization.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.IN_PROGRESS;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.RESTART, executor);

    return await this.getTask(task.id);
  }

  async suspendTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden suspension.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.SUSPENDED;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.SUSPEND, executor);

    return await this.getTask(task.id);
  }

  async completeTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state === TaskState.COMPLETED)
      throw new ForbiddenException('Task is already completed.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    this.completeSubTask(task, executor);
    task.state = TaskState.COMPLETED;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.COMPLETE, executor);

    return await this.getTask(task.id);
  }

  async completeSubTask(task: Task | number, executor?: User | number | string) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (!task.subTasks) return;
    for (const subTask of task.subTasks) {
      await this.completeSubTask(subTask, executor);
      subTask.state = TaskState.COMPLETED;
      await this.manager.save(subTask);
      await this.createTaskLog(subTask, ActionType.COMPLETE, executor);
    }
  }

  async updateTaskContent(
    task: Task | number,
    content: OutputData,
    executor?: User | number | string,
  ) {
    if (!(task instanceof Task)) task = await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden suspension.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    if (task.contents.length === 0) {
      const content = new Content();
      await this.manager.save(content);
      task.contents.push(content);
    }
    const lastContent = task.contents[task.contents.length - 1];
    lastContent.content = content;
    await this.manager.save(lastContent);
    return await this.getTask(task.id);
  }

  async commitOnTask(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.IN_PROGRESS)
      throw new ForbiddenException('Task is not in progress, forbidden submittion.');
    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.UNCONFIRMED;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.COMMIT, executor);
    return await this.getTask(task.id);
  }

  async refuseToCommit(task: Task | number, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state !== TaskState.UNCONFIRMED)
      throw new ForbiddenException('Task does not wait for comfirmtion, forbidden response.');

    await this.checkParentTaskNotInStates(task, [TaskState.IN_PROGRESS]);
    task.state = TaskState.IN_PROGRESS;
    await this.manager.save(task);
    await this.createTaskLog(task, ActionType.REFUSE, executor);
    if (task.contents.length > 0) {
      let cloneContent = new Content();
      cloneContent.content = task.contents[task.contents.length - 1].content;
      cloneContent.task = task;
      cloneContent = await this.manager.save(cloneContent);
    }
    return await this.getTask(task.id);
  }

  async createTaskLog(task: Task | number, action: ActionType, executor?: User | number | string) {
    task = task instanceof Task ? task : await this.getTask(task, false);
    let taskLog = new Log();
    if (executor)
      taskLog.executor =
        executor instanceof User ? executor : await this.userService.getUser(executor, false);

    taskLog.action = action; 
    taskLog.task = task;
    return await this.manager.save(taskLog);
  }

  async createSubTask(
    task: Task | number,
    name: string,
    executor?: User | number | string,
    options?: {
      admins?: User[] | number[] | string[];
      members?: User[] | number[] | string[];
      state?: TaskState;
    },
  ) {
    task = task instanceof Task ? task : await this.getTask(task);
    if (task.state === TaskState.UNCONFIRMED || task.state === TaskState.COMPLETED)
      throw new ForbiddenException(
        'Task is freezed (completed or unconfirmed), \
        forbidden subtask creation.',
      );

    await this.checkParentTaskNotInStates(task, [TaskState.SUSPENDED, TaskState.IN_PROGRESS]);

    if (!options.admins) {
      const fullAccess = await this.manager
        .createQueryBuilder(Access, 'access')
        .leftJoinAndSelect('access.task', 'task')
        .leftJoinAndSelect('access.group', 'group')
        .where('task.id = :id', { id: task.id })
        .andWhere('access.access = :type', { type: AccessType.FULL })
        .getMany();

      options['adminGroups'] = fullAccess.map((access) => access.group);
    }
    const subTask = await this.createTask(name, executor, options);
    subTask.superTask = task;
    await this.manager.save(subTask);
    // TODO: closure-table does not update when compounent'parent update yet. so we update it maunaly.
    // await this.manager.query(
    //   `UPDATE task_closure SET id_ancestor = ${task.id} WHERE id_descendant = ${subTask.id}`,
    // );

    return await this.getTask(task.id);
  }
}
