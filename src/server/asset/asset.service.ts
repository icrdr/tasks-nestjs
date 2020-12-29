import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import * as OSS from 'ali-oss';
import * as moment from 'moment';
import { OptionService } from '../option/option.service';
import { StsTokenRes } from '../../dtos/asset.dto';

@Injectable()
export class AssetService {
  constructor(
    private configService: ConfigService,
    private manager: EntityManager,
    private optionService: OptionService,
  ) {}

  async getStsToken() {
    const _stsToken = (await this.optionService.getOptionValue('stsToken')) as StsTokenRes;
    if (_stsToken) {
      if (moment(_stsToken.expiration) > moment()) {
        return _stsToken;
      }
    }
    const ossRegion = this.configService.get('ossRegion');
    const ossBucket = this.configService.get('ossBucket');
    const ossRoleArn = this.configService.get('ossRoleArn');
    const ossAccessKeyId = this.configService.get('ossAccessKeyId');
    const ossAccessKeySecret = this.configService.get('ossAccessKeySecret');

    //@ts-ignore
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
      const token = await sts.assumeRole(ossRoleArn, policy, 60 * 60, 'yimu-tasks');
      const stsToken = {
        region: ossRegion,
        accessKeyId: token.credentials.AccessKeyId,
        accessKeySecret: token.credentials.AccessKeySecret,
        stsToken: token.credentials.SecurityToken,
        bucket: ossBucket,
        expiration: moment().add(1, 'hours').format(),
      };
      await this.optionService.setOptionValue('stsToken', stsToken);
      return stsToken;
    } catch (e) {
      throw new InternalServerErrorException('Fail to get sts token.');
    }
  }
}
