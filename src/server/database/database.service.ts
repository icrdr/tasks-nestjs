import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'typeorm';
import { OptionService } from '../option/option.service';
import { UserService } from '../user/services/user.service';
import { internet } from 'faker';
import { RoleType } from '../user/entities/user.entity';

@Injectable()
export class DatabaseService {
  constructor(
    private optionService: OptionService,
    private connection: Connection,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  async addFakeUsers(number: number) {
    const users = [];

    for (const {} of Array(number)) {
      const user = await this.userService.addUser(internet.userName(), internet.password());
      users.push(user);
    }
    return users;
  }

  async addFakeTasks() {
    //TODO: fake task
  }

  async addDefault() {
    const options = this.configService.get('defaultOptions') as {
      [key: string]: string;
    };

    // add default options
    await this.optionService.setOptionValue('options', options);

    //add default user (admin)
    await this.userService.addUser(
      this.configService.get('adminUsername'),
      this.configService.get('adminPassword'),
      {
        role: RoleType.ADMIN,
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
