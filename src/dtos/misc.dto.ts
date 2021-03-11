import { ClassType } from 'react';
import { IsBoolean, IsDate, IsNumber, IsNumberString, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListDTO {
  @IsOptional()
  @IsNumber()
  current?: number;

  @IsOptional()
  @IsNumber()
  pageSize?: number;

  @IsOptional()
  @IsNumber()
  skip?: number;

  @IsOptional()
  @IsNumber()
  take?: number;

  @IsOptional()
  @Type(() => String)
  @Transform((v) => v === 'true')
  @IsBoolean()
  all?: boolean;
}

export class ListRes {
  current?: number;
  pageSize?: number;
  total: number;
}

export class IdDTO {
  @IsNumber()
  id: number;
}

export class UserIdDTO {
  @IsNumber()
  userId: number;
}

export function ListResSerialize(list: any[], Class: any) {
  return new Class({
    list: list[0],
    total: list[1],
  });
}
