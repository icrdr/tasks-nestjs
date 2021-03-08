import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { Asset } from '../server/task/entities/asset.entity';
import { ListDTO, ListRes } from './misc.dto';
import { UserRes } from './user.dto';

export class StsTokenRes {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  stsToken: string;
  bucket: string;
  expiration: string;
}

export class AddAssetDTO {
  @IsString()
  name: string;

  @IsString()
  source: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  size?: number;
}

export class GetAssetsDTO extends ListDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsDate()
  uploadAfter?: Date;

  @IsOptional()
  @IsDate()
  uploadBefore?: Date;

  @IsOptional()
  @IsNumber()
  taskId?: number;

  @IsOptional()
  @IsNumber()
  spaceId?: number;

  @Type(() => String)
  @IsOptional()
  @Transform((v) => v === 'true')
  @IsBoolean()
  isRoot?: boolean;
}

export class ChangeAssetDTO {
  @IsOptional()
  @IsString()
  name?: string;
}

@Exclude()
export class AssetRes {
  @Expose()
  id: number;

  @Expose()
  createAt: Date;

  @Expose()
  @Transform((i) => (i ? new UserRes(i) : null))
  uploader: UserRes;

  @Expose()
  name: string;

  @Expose()
  type: string;

  @Expose()
  format: string;

  @Expose()
  size: number;

  @Expose()
  source: string;

  @Expose()
  preview: string;

  constructor(partial: Partial<AssetRes>) {
    Object.assign(this, partial);
  }
}

export class AssetListRes extends ListRes {
  @Transform((a) => (a ? a.map((i: Asset) => new AssetRes(i)) : []))
  list: AssetRes[];

  constructor(partial: Partial<AssetListRes>) {
    super();
    Object.assign(this, partial);
  }
}
