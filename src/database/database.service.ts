import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'typeorm';
import { OptionService } from '../option/option.service';
import { RoleService } from '../user/services/role.service';
import { UserService } from '../user/services/user.service';

@Injectable()
export class DatabaseService {
  constructor(
    private roleService: RoleService,
    private optionService: OptionService,
    private connection: Connection,
    private userService: UserService,
    private configService: ConfigService,
    @Inject('FAKER_LIB')
    private faker: Faker.FakerStatic,
  ) {}

  async createFakeUsers(number: number) {
    const users = [];

    for (const {} of Array(number)) {
      const user = await this.userService.createUser(
        this.faker.internet.userName(),
        this.faker.internet.password(),
      );
      users.push(user);
    }
    return users;
  }

  async createFakeTasks() {
    //TODO: fake task
  }

  async createDefault() {
    const defaultOptions = this.configService.get('defaultOptions') as {
      [key: string]: string;
    };
    const defaultRoles = this.configService.get('defaultRoles') as {
      [key: string]: string[];
    };

    // create default options
    for (const key in defaultOptions) {
      const value: string = defaultOptions[key];
      await this.optionService.createOption(key, value);
    }

    // create default roles
    for (const key in defaultRoles) {
      await this.roleService.createRole(key, {
        perms: defaultRoles[key],
      });
    }

    //create default user (admin)
    await this.userService.createUser(
      this.configService.get('adminUsername'),
      this.configService.get('adminPassword'),
      {
        roles: ['admin'],
      },
    );
  }

  async close() {
    await this.connection.close();
  }

  async clear() {
    await this.connection.dropDatabase();
    await this.connection.synchronize();
  }
}
