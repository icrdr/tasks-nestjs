import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Option } from './option.entity';

@Injectable()
export class OptionService {
  constructor(private manager: EntityManager) {}

  async setOptionValue(name: string, value: object) {
    const option = (await this.manager.findOne(Option, { name: name })) || new Option();
    option.name = name;
    option.value = value;
    await this.manager.save(option);
    return option;
  }

  async getOptionValue(name: string): Promise<object | undefined> {
    const option = await this.manager.findOne(Option, { name: name });
    return option ? option.value : undefined;
  }
}
