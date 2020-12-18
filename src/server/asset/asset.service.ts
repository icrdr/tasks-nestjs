import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import * as OSS from 'ali-oss';

@Injectable()
export class AssetService {
  constructor(private configService: ConfigService, private manager: EntityManager) {}

  async getStsToken() {
    const ossRegion = this.configService.get('ossRegion');
    const ossBucket = this.configService.get('ossBucket');
    const ossRoleArn = this.configService.get('ossRoleArn');
    const ossAccessKeyId = this.configService.get('ossAccessKeyId');
    const ossAccessKeySecret = this.configService.get('ossAccessKeySecret');

    const sts = new OSS.STS({
      accessKeyId: ossAccessKeyId,
      accessKeySecret: ossAccessKeySecret,
    });
    const policy = {
      Statement: [
        {
          Action: ['oss:*'],
          Effect: 'Allow',
          Resource: ['acs:oss:*:*:yimu-tasks/*'],
        },
      ],
      Version: '1',
    };
    try {
      const token = await sts.assumeRole(ossRoleArn, policy, 15 * 60, 'yimu-tasks');
      return {
        region: ossRegion,
        accessKeyId: token.credentials.AccessKeyId,
        accessKeySecret: token.credentials.AccessKeySecret,
        stsToken: token.credentials.SecurityToken,
        bucket: ossBucket,
      };
    } catch (e) {
      throw new InternalServerErrorException('Fail to get sts token.');
    }
  }
}
