import { Module } from '@nestjs/common';
import * as path from 'path';
import * as crypto from 'crypto';
import { UtilityService } from './utility.service';
import * as jwt from 'jsonwebtoken';
import * as faker from 'faker';
import { TypeGuardService } from './typeGuard.service';

export const pathProvider = {
  provide: 'PATH_LIB',
  useValue: path,
};

export const cryptoProvider = {
  provide: 'CRYPTO_LIB',
  useValue: crypto,
};

export const jwtProvider = {
  provide: 'JWT_LIB',
  useValue: jwt,
};

export const fakerProvider = {
  provide: 'FAKER_LIB',
  useValue: faker,
};

@Module({
  providers: [
    pathProvider,
    cryptoProvider,
    jwtProvider,
    fakerProvider,
    UtilityService,
    TypeGuardService,
  ],
  exports: [
    pathProvider,
    cryptoProvider,
    jwtProvider,
    fakerProvider,
    UtilityService,
    TypeGuardService,
  ],
})
export class CommonModule {}
