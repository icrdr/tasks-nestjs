import { ClassType } from 'react';
import { IsNumber, IsNumberString } from 'class-validator';

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
