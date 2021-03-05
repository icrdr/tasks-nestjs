import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}

export enum CommentType {
  TEXT = 'text',
  IMAGE = 'image',
  ASSET = 'asset',
}

export enum PropertyType {
  MEMBER = 'member',
  TASK = 'task',
  ASSET = 'asset',
}

export enum PropertyForm {
  NUMBER = 'number',
  STRING = 'string',
}

export enum ViewForm {
  TABLE = 'table',
  LIST = 'list',
  CARD = 'gallery',
}

export enum ViewType {
  MEMBER = 'member',
  TASK = 'task',
  ASSET = 'asset',
}

export interface ViewOption {
  form: ViewForm;
  headers: any;
}

export enum LogAction {
  START = 'start',
  RESTART = 'restart',
  SUSPEND = 'suspend',
  COMPLETE = 'complete',
  COMMIT = 'commit',
  REFUSE = 'refuse',
  CREATE = 'create',
  UPDATA = 'update',
  DELETE = 'delete',
}

export enum AccessLevel {
  FULL = 'full',
  EDIT = 'edit',
  VIEW = 'view',
}

export enum TaskState {
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
  UNCONFIRMED = 'unconfirmed',
}

export enum RoleType {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

export enum ThirdAuthType {
  WECHAT = 'wechat',
}
