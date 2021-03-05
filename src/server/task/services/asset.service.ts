import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import { Asset } from '../entities/asset.entity';
import { Space } from '../entities/space.entity';
import { Task } from '../entities/task.entity';
import { SpaceService } from './space.service';
import { TaskService } from './task.service';
import { open } from 'psd';

import { join } from 'path';
import { CommonService } from '../../common/common.service';
import * as moment from 'moment';
import { unlinkSync } from 'fs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class AssetService {
  assetQuery: SelectQueryBuilder<Asset>;
  constructor(
    private taskService: TaskService,
    private spaceService: SpaceService,
    private userService: UserService,
    private commonService: CommonService,
    private manager: EntityManager,
    @InjectQueue('asset') private assetQueue: Queue,
  ) {
    this.assetQuery = this.manager
      .createQueryBuilder(Asset, 'asset')
      .leftJoinAndSelect('asset.space', 'space')
      .leftJoinAndSelect('asset.task', 'task')
      .leftJoinAndSelect('asset.uploader', 'uploader');
  }

  async generatePreview(asset: Asset | number) {
    asset = asset instanceof Asset ? asset : await this.getAsset(asset);
    const oss = await this.commonService.getOssClient();
    const objectName = moment().format('YYYYMMDDhhmmss');
    const previewPath = join(process.cwd(), 'temp', objectName);
    const _source = asset.source.split(':');

    try {
      if (_source[0] === 'oss') {
        await oss.get(_source[1], previewPath);
      } else {
      }
      const psd = await open(previewPath);
      await psd.image.saveAsPng(previewPath);
      await oss.put(objectName, previewPath);
    } catch {
      throw Error('cannot generate preview of ' + asset.name);
    }

    asset.preview = 'oss:' + objectName;
    this.manager.save(asset);
    unlinkSync(previewPath);
  }

  async changeAsset(asset: Asset | number, options: { name?: string } = {}) {
    asset = asset instanceof Asset ? asset : await this.getAsset(asset);
    if (options.name) asset.name = options.name;
    return await this.manager.save(asset);
  }

  async addAsset(
    name: string,
    source: string,
    options: {
      space?: Space | number;
      task?: Task | number;
      uploader?: User | number;
      preview?: string;
      format?: string;
      type?: string;
      size?: number;
    } = {},
  ) {
    if (!options.space && !options.task) {
      throw new NotFoundException('Task or space, at least match one.');
    }

    let asset = new Asset();
    asset.name = name;
    asset.source = source;
    if (options.format) asset.format = options.format;

    if (options.type) {
      asset.type = options.type;
      if (
        ['image/gif', 'image/x-icon', 'image/jpeg', 'image/png', 'image/svg+xml	'].indexOf(
          options.type,
        ) >= 0
      )
        asset.preview = source;
    }

    if (options.size) asset.size = options.size;
    if (options.preview) asset.preview = options.preview;

    if (options.uploader)
      asset.uploader =
        options.uploader instanceof User
          ? options.uploader
          : await this.userService.getUser(options.uploader);

    if (options.space)
      asset.space =
        options.space instanceof Space
          ? options.space
          : await this.spaceService.getSpace(options.space);

    if (options.task) {
      const task =
        options.task instanceof Task ? options.task : await this.taskService.getTask(options.task);
      asset.task = task;
      asset.space = task.space;
    }

    asset = await this.manager.save(asset);
    if (['image/psd', 'image/bmp'].indexOf(asset.type) >= 0) {
      await this.assetQueue.add('generatePreview', {
        assetId: asset.id,
      });
    }

    return await this.getAsset(asset.id, false);
  }

  async getAsset(id: number, exception = true) {
    const query = this.assetQuery.clone().where('asset.id = :id', { id });
    const asset = await query.getOne();
    if (!asset && exception) throw new NotFoundException('Asset was not found.');
    return asset;
  }

  async getAssetId(asset: Asset | number) {
    return asset instanceof Asset ? asset.id : asset;
  }

  async deleteAsset(asset: Asset | number) {
    const oss = await this.commonService.getOssClient();
    asset = asset instanceof Asset ? asset : await this.getAsset(asset);
    await this.manager.delete(Asset, asset.id);
    const _source = asset.source.split(':');

    try {
      if (_source[0] === 'oss') {
        await oss.delete(_source[1]);
      }
      if (asset.preview) {
        const _preview = asset.preview.split(':');
        if (_preview[0] === 'oss') {
          await oss.delete(_preview[1]);
        }
      }
    } catch {
      throw new InternalServerErrorException('Fail to delete oss object');
    }
  }

  async getAssets(
    options: {
      space?: Space | number;
      task?: Task | number;
      isRoot?: boolean;
      name?: string;
      format?: string;
      uploadAfter?: Date;
      uploadBefore?: Date;
      uploader?: User | number;
      pageSize?: number;
      current?: number;
      skip?: number;
      take?: number;
    } = {},
  ) {
    let query = this.assetQuery.clone();

    if (options.space) {
      const spaceId = await this.spaceService.getSpaceId(options.space);
      query = query.andWhere('space.id = :spaceId', { spaceId });
    }
    if (options.task) {
      const taskId = await this.taskService.getTaskId(options.task);
      query = query.andWhere('task.id = :taskId', { taskId });
    }
    if (options.isRoot) {
      query = query.andWhere('asset.task IS NULL');
    }
    if (options.uploader) {
      const userId = await this.userService.getUserId(options.uploader);
      query = query.andWhere('uploader.id = :userId', { userId });
    }

    if (options.name) {
      query = query.andWhere('asset.name LIKE :name', {
        name: `%${options.name}%`,
      });
    }

    if (options.format) {
      query = query.andWhere('asset.format LIKE :format', {
        format: `%${options.format}%`,
      });
    }

    if (options.uploadAfter) {
      const after = options.uploadAfter;
      query = query.andWhere('asset.createAt >= :after', { after });
    }

    if (options.uploadBefore) {
      const before = options.uploadBefore;
      query = query.andWhere('asset.createAt < :before', { before });
    }

    query = query.orderBy('asset.id', 'DESC');

    if (!options.skip || !options.take) {
      query = query.skip((options.current - 1) * options.pageSize || 0).take(options.pageSize || 5);
    }

    if (options.skip !== undefined && options.take) {
      query = query.skip(options.skip).take(options.take);
    }

    return await query.getManyAndCount();
  }
}
