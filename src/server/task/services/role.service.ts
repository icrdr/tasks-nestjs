import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { Assignment, Member, Role, Space } from '../entities/space.entity';
import { unionArrays } from '@utils/utils';
import { AccessLevel } from '../../common/common.entity';
import { SpaceService } from './space.service';
import { AssignmentService } from './assignment.service';

@Injectable()
export class RoleService {
  assignmentQuery: SelectQueryBuilder<Assignment>;
  memberQuery: SelectQueryBuilder<Member>;
  spaceQuery: SelectQueryBuilder<Space>;
  roleQuery: SelectQueryBuilder<Role>;

  constructor(
    @Inject(forwardRef(() => SpaceService))
    private spaceService: SpaceService,
    @Inject(forwardRef(() => AssignmentService))
    private assignmentService: AssignmentService,
    private manager: EntityManager,
  ) {
    this.roleQuery = this.manager
      .createQueryBuilder(Role, 'role')
      .leftJoinAndSelect('role.space', 'space');
  }

  async removeRole(role: Role | number) {
    role = role instanceof Role ? role : await this.getRole(role, false);
    const assignments = (await this.assignmentService.getAssignments({ role }))[0];

    for (const assignment of assignments) {
      this.assignmentService.removeAssignment(assignment);
    }

    await this.manager.delete(Role, role.id);
  }

  async addRole(space: Space | number, name: string, access: AccessLevel) {
    //check if space and user are exsited
    space = space instanceof Space ? space : await this.spaceService.getSpace(space, false);
    let role = await this.getRoleByName(space.id, name, false);
    if (role) return role;

    role = new Role();
    role.name = name;
    role.access = access;
    role.space = space;
    return await this.manager.save(role);
  }

  async changeRole(role: Role | number, options: { name?: string; access?: AccessLevel } = {}) {
    role = role instanceof Role ? role : await this.getRole(role, false);
    if (options.name) role.name = options.name;
    if (options.access) role.access = options.access;
    return await this.manager.save(role);
  }

  async getRoleByName(space: Space | number, name: string, exception = true) {
    const spaceId = await this.spaceService.getSpaceId(space);
    let query = this.roleQuery
      .clone()
      .andWhere('space.id = :spaceId', { spaceId })
      .andWhere('role.name = :name', { name });
    const role = await query.getOne();
    if (!role && exception) throw new NotFoundException('Role was not found.');
    return role;
  }

  async getRole(identiy: number, exception = true) {
    let query = this.roleQuery.clone().andWhere('role.id = :identiy', { identiy });
    const role = await query.getOne();
    if (!role && exception) throw new NotFoundException('Role was not found.');
    return role;
  }

  async getRoles(
    options: {
      space?: Space | number;
      access?: AccessLevel[] | AccessLevel;
      current?: number;
      pageSize?: number;
    } = {},
  ) {
    let query = this.roleQuery.clone();

    if (options.space) {
      const spaceId = await this.spaceService.getSpaceId(options.space);
      query = query.andWhere('space.id = :spaceId', { spaceId });
    }

    if (options.access) {
      query = query.andWhere('role.access IN (:...access)', {
        access: unionArrays([options.access]),
      });
    }

    // query = query
    //   .orderBy('role.id', 'DESC')
    //   .skip((options.current - 1) * options.pageSize || 0)
    //   .take(options.pageSize || 5);

    return await query.getManyAndCount();
  }

  async getRoleId(role: Role | number) {
    role = role instanceof Role ? role : await this.getRole(role);
    return role.id;
  }
}
