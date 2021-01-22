import { User } from '@server/user/entities/user.entity';

export function isStringArray(array: any[]): array is string[] {
  return typeof array[0] === 'string';
}

export function isUserArray(array: any[]): array is User[] {
  return array[0] instanceof User;
}
