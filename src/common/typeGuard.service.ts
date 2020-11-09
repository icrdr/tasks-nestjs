import { Injectable } from '@nestjs/common';
import { Perm, Role } from '../user/entities/user.entity';

@Injectable()
export class TypeGuardService {
  isStringArray(array: any[]): array is string[] {
    return typeof array[0] === 'string';
  }

  isPermArray(array: any[]): array is Perm[] {
    return array[0] instanceof Perm;
  }

  isRoleArray(array: any[]): array is Role[] {
    return array[0] instanceof Role;
  }
}
