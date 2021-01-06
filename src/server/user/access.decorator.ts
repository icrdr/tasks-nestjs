import { SetMetadata } from '@nestjs/common';

export const Access = (...perms: string[]) => SetMetadata('access', perms);
