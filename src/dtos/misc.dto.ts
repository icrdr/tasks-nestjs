import { ClassType } from 'react';
import { IsNumber, IsNumberString, IsOptional } from 'class-validator';

export class ListDTO {
  @IsOptional()
  @IsNumber()
  current?: number;

  @IsOptional()
  @IsNumber()
  pageSize?: number;
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

export function ListResSerialize(list: any[], Class: any) {
  return new Class({
    list: list[0],
    total: list[1],
  });
}
