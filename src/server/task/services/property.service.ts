import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { Space } from '../entities/space.entity';
import { SpaceService } from './space.service';
import { Property } from '../entities/property.entity';
import { PropertyForm, PropertyType } from '../../common/common.entity';

@Injectable()
export class PropertyService {
  propertyQuery: SelectQueryBuilder<Property>;
  constructor(private spaceService: SpaceService, private manager: EntityManager) {
    this.propertyQuery = this.manager
      .createQueryBuilder(Property, 'property')
      .leftJoinAndSelect('property.space', 'space');
  }

  async removeProperty(property: Property | number) {
    property = property instanceof Property ? property : await this.getProperty(property, false);
    await this.manager.delete(Property, property.id);
  }

  async addProperty(
    space: Space | number,
    name: string,
    type: PropertyType,
    form?: PropertyForm,
    items?: string[],
  ) {
    //check if space and prop are exsited
    space = space instanceof Space ? space : await this.spaceService.getSpace(space, false);
    let property = await this.getPropertyByName(space.id, name, false);
    if (property) return property;

    property = new Property();
    property.space = space;
    property.name = name;
    property.type = type;
    property.form = form || PropertyForm.STRING;
    if (items) property.items = items;
    return await this.manager.save(property);
  }

  async getPropertyByName(space: Space | number, name: string, exception = true) {
    const spaceId = await this.spaceService.getSpaceId(space);
    let query = this.propertyQuery
      .clone()
      .andWhere('space.id = :spaceId', { spaceId })
      .andWhere('property.name = :name', { name });
    const property = await query.getOne();
    if (!property && exception) throw new NotFoundException('Property was not found.');
    return property;
  }

  async getProperty(identiy: number, exception = true) {
    let query = this.propertyQuery.clone().andWhere('property.id = :identiy', { identiy });
    const property = await query.getOne();
    if (!property && exception) throw new NotFoundException('Property was not found.');
    return property;
  }

  async changeProperty(
    property: Property | number,
    options: { name?: string; type?: PropertyType; form?: PropertyForm; items?: string[] } = {},
  ) {
    property = property instanceof Property ? property : await this.getProperty(property, false);
    if (options.name) property.name = options.name;
    if (options.type) property.type = options.type;
    if (options.form) property.form = options.form;
    if (options.items) property.items = options.items;
    return await this.manager.save(property);
  }

  async getProperties(
    options: {
      space?: Space | number;
      type?: PropertyType;
      form?: PropertyForm;
      current?: number;
      pageSize?: number;
    } = {},
  ) {
    let query = this.propertyQuery.clone();

    if (options.space) {
      const spaceId = await this.spaceService.getSpaceId(options.space);
      query = query.andWhere('space.id = :spaceId', { spaceId });
    }

    if (options.type) {
      query = query.andWhere('property.type IN (:...type)', { type: [options.type] });
    }

    if (options.form) {
      query = query.andWhere('property.form IN (:...form)', { form: [options.form] });
    }
    // query = query
    //   .orderBy('property.id', 'DESC')
    //   .skip((options.current - 1) * options.pageSize || 0)
    //   .take(options.pageSize || 5);
    return await query.getManyAndCount();
  }

  async getPropertyId(property: Property | number) {
    property = property instanceof Property ? property : await this.getProperty(property);
    return property.id;
  }
}
