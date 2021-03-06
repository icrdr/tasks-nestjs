import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Brackets, EntityManager, SelectQueryBuilder } from "typeorm";
import { User } from "@server/user/entities/user.entity";
import { UserService } from "@server/user/services/user.service";
import { Assignment, Member, Role, Space } from "../entities/space.entity";
import { unionArrays } from "@utils/utils";
import { ConfigService } from "@nestjs/config";
import { Task } from "../entities/task.entity";
import { TaskService } from "./task.service";
import { AccessLevel } from "../../common/common.entity";

@Injectable()
export class SpaceService {
  assignmentQuery: SelectQueryBuilder<Assignment>;
  memberQuery: SelectQueryBuilder<Member>;
  spaceQuery: SelectQueryBuilder<Space>;
  roleQuery: SelectQueryBuilder<Role>;

  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(forwardRef(() => TaskService))
    private taskService: TaskService,
    private configService: ConfigService,
    private manager: EntityManager
  ) {
    this.spaceQuery = this.manager
      .createQueryBuilder(Space, "space")
      .leftJoinAndSelect("space.members", "member")
      .leftJoinAndSelect("member.user", "user")
      .leftJoinAndSelect("space.roles", "sRole")
      .leftJoinAndSelect("space.assignments", "assignment")
      .leftJoinAndSelect("assignment.role", "role");

    this.assignmentQuery = this.manager
      .createQueryBuilder(Assignment, "assignment")
      .leftJoinAndSelect("assignment.space", "space")
      .leftJoinAndSelect("assignment.root", "root")
      .leftJoinAndSelect("assignment.tasks", "task")
      .leftJoinAndSelect("assignment.members", "member")
      .leftJoinAndSelect("assignment.role", "role")
      .leftJoinAndSelect("member.user", "user");

    this.memberQuery = this.manager
      .createQueryBuilder(Member, "member")
      .leftJoinAndSelect("member.space", "space")
      .leftJoinAndSelect("member.user", "user");

    this.roleQuery = this.manager
      .createQueryBuilder(Role, "role")
      .leftJoinAndSelect("role.space", "space");
  }

  async addRole(space: Space | number, name: string, access: AccessLevel) {
    //check if space and user are exsited
    space = space instanceof Space ? space : await this.getSpace(space, false);
    let role = await this.getRoleByName(space.id, name, false);
    if (role) return role;

    role = new Role();
    role.name = name;
    role.access = access;
    role.space = space;
    return await this.manager.save(role);
  }

  async changeRole(
    role: Role | number,
    options: { name?: string; access?: AccessLevel } = {}
  ) {
    role = role instanceof Role ? role : await this.getRole(role, false);
    if (options.name) role.name = options.name;
    if (options.access) role.access = options.access;
    return await this.manager.save(role);
  }

  async getRoleByName(space: Space | number, name: string, exception = true) {
    const spaceId = await this.getSpaceId(space);
    let query = this.roleQuery
      .clone()
      .andWhere("space.id = :spaceId", { spaceId })
      .andWhere("role.name = :name", { name });
    const role = await query.getOne();
    if (!role && exception) throw new NotFoundException("Role was not found.");
    return role;
  }

  async getRole(identiy: number, exception = true) {
    let query = this.roleQuery
      .clone()
      .andWhere("role.id = :identiy", { identiy });
    const role = await query.getOne();
    if (!role && exception) throw new NotFoundException("Role was not found.");
    return role;
  }

  async getRoles(
    options: {
      space?: Space | number;
      access?: AccessLevel[] | AccessLevel;
      current?: number;
      pageSize?: number;
    } = {}
  ) {
    let query = this.roleQuery.clone();

    if (options.space) {
      const spaceId = await this.getSpaceId(options.space);
      query = query.andWhere("space.id = :spaceId", { spaceId });
    }

    if (options.access) {
      query = query.andWhere("role.access IN (:...access)", {
        access: unionArrays([options.access]),
      });
    }

    // query = query
    //   .orderBy('role.id', 'DESC')
    //   .skip((options.current - 1) * options.pageSize || 0)
    //   .take(options.pageSize || 5);

    return await query.getManyAndCount();
  }
  async appendAssignment(scope: Task | Space, assignment: Assignment | number) {
    assignment =
      assignment instanceof Assignment
        ? assignment
        : await this.getAssignment(assignment);
    if (scope instanceof Task) {
      assignment.tasks.push(scope);
    } else {
      assignment.space = scope;
    }
    return await this.manager.save(assignment);
  }

  async addAssignment(
    users: User[] | number[],
    role: Role | number,
    options: {
      name?: string;
      root?: Space | number;
      space?: Space | number;
      task?: Task | number;
    } = {}
  ) {
    role = role instanceof Role ? role : await this.getRole(role);
    if (!options.space && !options.root && !options.task)
      throw new NotFoundException("space or root should not be empty");

    let space: Space, task: Task, root: Space;

    if (options.task) {
      task =
        options.task instanceof Task
          ? options.task
          : await this.taskService.getTask(options.task);
      space = task.space;
    }

    if (options.space) {
      space =
        options.space instanceof Space
          ? options.space
          : await this.getSpace(options.space);
    }

    if (options.root) {
      root =
        options.root instanceof Space
          ? options.root
          : await this.getSpace(options.root);
    }

    const members = [];
    users = unionArrays(users);
    for await (const user of users) {
      const member = await this.getMember(space || root, user);
      members.push(member);
    }

    let assignment = new Assignment();
    assignment.role = role;
    assignment.members = members;
    if (options.name) assignment.name = options.name;
    if (options.task) assignment.tasks = [task];
    if (options.space) assignment.space = space;
    if (options.root) assignment.root = root;

    return await this.manager.save(assignment);
  }

  async changeAssignment(
    assignment: Assignment | number,
    options: { name: string; role: Role | number }
  ) {
    assignment =
      assignment instanceof Assignment
        ? assignment
        : await this.getAssignment(assignment);
    if (options.name) assignment.name = options.name;
    if (options.role) {
      const role =
        options.role instanceof Role
          ? options.role
          : await this.getRole(options.role);
      assignment.role = role;
    }

    return await this.manager.save(assignment);
  }

  async addAssignmentMember(
    assignment: Assignment | number,
    user: User | number
  ) {
    assignment =
      assignment instanceof Assignment
        ? assignment
        : await this.getAssignment(assignment);
    const space = assignment.root || assignment.space;
    const member = await this.getMember(space, user);
    assignment.members.push(member);

    return await this.manager.save(assignment);
  }

  async removeAssignmentMember(
    assignment: Assignment | number,
    user: User | number
  ) {
    assignment =
      assignment instanceof Assignment
        ? assignment
        : await this.getAssignment(assignment);
    user = user instanceof User ? user : await this.userService.getUser(user);

    assignment.members = assignment.members.filter(
      (member) => member.user.id !== (user as User).id
    );

    return await this.manager.save(assignment);
  }

  async getAssignment(id: number, exception = true) {
    const query = this.assignmentQuery
      .clone()
      .where("assignment.id = :id", { id });
    const assignment = await query.getOne();
    if (!assignment && exception)
      throw new NotFoundException("Assignment was not found.");
    return assignment;
  }

  async deleteAssignment(assignment: Assignment | number) {
    assignment =
      assignment instanceof Assignment
        ? assignment
        : await this.getAssignment(assignment);
    await this.manager.delete(Assignment, assignment.id);
  }

  async removeAssignment(scope: Task | Space, assignment: Assignment | number) {
    assignment =
      assignment instanceof Assignment
        ? assignment
        : await this.getAssignment(assignment);

    if (assignment.root) {
      if (scope instanceof Task) {
        assignment.tasks = assignment.tasks.filter(
          (task) => task.id !== scope.id
        );
      } else {
        assignment.space = null;
      }
      await this.manager.save(assignment);
    } else {
      await this.deleteAssignment(assignment);
    }
  }

  async getAssignments(
    options: {
      root?: Space | number;
      space?: Space | number;
      task?: Task | number;
      user?: User | number;
      current?: number;
      pageSize?: number;
      all?: boolean;
    } = {}
  ) {
    let query = this.assignmentQuery.clone();

    if (options.user) {
      const userId = await this.userService.getUserId(options.user);
      query = query.andWhere("user.id = :userId", { userId });
    }

    if (options.task) {
      const taskId = await this.taskService.getTaskId(options.task);
      query = query.andWhere("task.id = :taskId", { taskId });
    }

    if (options.space) {
      const spaceId = await this.getSpaceId(options.space);
      query = query.andWhere("space.id = :spaceId", { spaceId });
    }
    if (options.root) {
      const rootId = await this.getSpaceId(options.root);
      query = query.andWhere("root.id = :rootId", { rootId });
    }

    if (!options.all) {
      query = query
        .orderBy("space.id", "DESC")
        .skip((options.current - 1) * options.pageSize || 0)
        .take(options.pageSize || 5);
    }

    return await query.getManyAndCount();
  }

  async addSpace(
    name: string,
    executor?: User | number,
    options: {
      admins?: User[] | number[];
      members?: User[] | number[];
      access?: AccessLevel;
    } = {}
  ) {
    let space = new Space();
    space.name = name;
    if (options.access) space.access = options.access;
    space = await this.manager.save(space);
    //TODO: add log

    //add admin group
    if (options.admins) {
      const adminMembers = [];
      for (const admin of options.admins) {
        adminMembers.push(await this.addMember(space, admin));
      }
      const adminRole = await this.addRole(space, "管理员", AccessLevel.FULL);
      await this.addAssignment(options.admins, adminRole, {
        name: "管理员组",
        root: space,
        space,
      });
    }

    //add member
    if (options.members) {
      for (const member of options.members) {
        await this.addMember(space, member);
      }
    }
    return await this.getSpace(space.id);
  }

  async addMember(space: Space | number, user: User | number) {
    //check if space and user are exsited
    space = space instanceof Space ? space : await this.getSpace(space, false);
    user =
      user instanceof User ? user : await this.userService.getUser(user, false);
    if (!space || !user) return;
    let member = await this.getMember(space.id, user.id, false);
    if (member) return member;

    member = new Member();
    member.user = user;
    member.space = space;
    await this.manager.save(member);
    return await this.getMember(space.id, user.id, false);
  }

  async getMember(
    space: Space | number,
    user: User | number,
    exception = true
  ) {
    const spaceId = await this.getSpaceId(space);
    const userId = await this.userService.getUserId(user);

    let query = this.memberQuery
      .clone()
      .andWhere("space.id = :spaceId", { spaceId })
      .andWhere("user.id = :userId", { userId });
    const member = await query.getOne();
    if (!member && exception)
      throw new NotFoundException("Member was not found.");
    return member;
  }

  async getMembers(
    options: {
      space?: Space | number;
      username?: string;
      fullName?: string;
      pageSize?: number;
      current?: number;
      skip?: number;
      take?: number;
    } = {}
  ) {
    let query = this.memberQuery.clone();

    if (options.space) {
      const spaceId = await this.getSpaceId(options.space);
      query = query.andWhere("space.id = :spaceId", { spaceId });
    }
    if (options.username) {
      query = query.andWhere("user.username LIKE :username", {
        username: `%${options.username}%`,
      });
    }

    if (options.fullName) {
      query = query.andWhere("user.fullName LIKE :fullName", {
        fullName: `%${options.fullName}%`,
      });
    }

    query = query.orderBy("space.id", "DESC");

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

  // async addLog(space: Space | number, action: LogAction, executor?: User | number) {
  //   let log = new Log();
  //   space = space instanceof Space ? space : await this.getSpace(space);
  //   if(executor){
  //     executor = executor instanceof User ? executor : await this.userService.getUser(executor);
  //     log.executor = executor;
  //   }
  //   log.space = space;
  //   log.action = action;
  //   return await this.manager.save(log);
  // }

  async isScopeAdmin(task: Task, user: User | number) {
    const superTaskId = task.superTask ? task.superTask.id : undefined;
    const spaceId = task.space.id;
    const userId = await this.userService.getUserId(user);
    if (
      task.space.access === AccessLevel.FULL ||
      task.superTask?.access === AccessLevel.FULL
    )
      return true;

    let query = this.assignmentQuery
      .clone()
      .andWhere("user.id = :userId", { userId })
      .andWhere(
        new Brackets((qb) => {
          qb.where("space.id = :spaceId", { spaceId }).orWhere(
            "task.id = :superTaskId",
            {
              superTaskId,
            }
          );
        })
      )
      .andWhere("role.access = :roleAccess", {
        roleAccess: AccessLevel.FULL,
      });

    return !!(await query.getOne());
  }

  async getSpaceAccess(space: Space | number, user: User | number) {
    space = space instanceof Space ? space : await this.getSpace(space);
    // 1. cheack if is space member
    if (!(await this.getMember(space, user))) return [];

    // 2. cheack all assignments of space and space default access
    const assignments = (
      await this.getAssignments({ space, user, all: true })
    )[0];
    let access = this.configService.get("taskAccess")[space.access];
    access = access ? [access] : [];

    assignments.forEach(
      (a) =>
        (access = access.concat(
          this.configService.get("taskAccess")[a.role.access]
        ))
    );
    return unionArrays(access);
  }

  async getSpaceId(space: Space | number) {
    space = space instanceof Space ? space : await this.getSpace(space);
    return space.id;
  }

  async getRoleId(role: Role | number) {
    role = role instanceof Role ? role : await this.getRole(role);
    return role.id;
  }

  async getSpace(id: number, exception = true) {
    let query = this.spaceQuery.clone().where("space.id = :id", { id });
    const space = await query.getOne();
    if (!space && exception)
      throw new NotFoundException("Space was not found.");
    return space;
  }

  async changeSpace(
    space: Space | number,
    options: { name: string; access: AccessLevel }
  ) {
    space = space instanceof Space ? space : await this.getSpace(space);
    if (options.name) space.name = options.name;
    if (options.access !== undefined) space.access = options.access;

    return await this.manager.save(space);
  }

  async getSpaces(
    options: {
      user?: User | number;
      pageSize?: number;
      current?: number;
    } = {}
  ) {
    let query = this.spaceQuery.clone();

    if (options.user) {
      const userId = await this.userService.getUserId(options.user);
      query = query.andWhere("user.id = :userId", { userId });
    }

    // add all other member back.
    query = query
      .leftJoinAndSelect("space.members", "_member")
      .leftJoinAndSelect("_member.user", "_user");

    query = query
      .orderBy("space.id", "DESC")
      .skip((options.current - 1) * options.pageSize || 0)
      .take(options.pageSize || 5);

    return await query.getManyAndCount();
  }
}
