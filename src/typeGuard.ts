import { Perm, Role, User } from './user/entities/user.entity';

export function isStringArray(array: any[]): array is string[] {
  return typeof array[0] === 'string';
}

export function isPermArray(array: any[]): array is Perm[] {
  return array[0] instanceof Perm;
}

export function isRoleArray(array: any[]): array is Role[] {
  return array[0] instanceof Role;
}

export function isUserArray(array: any[]): array is User[] {
  return array[0] instanceof User;
}
