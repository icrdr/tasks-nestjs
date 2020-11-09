import { Module } from '@nestjs/common';
import * as path from 'path';
import * as crypto from 'crypto';
import { UtilityService } from './utility.service';
import * as jwt from 'jsonwebtoken';
import * as faker from 'faker';
import { TypeGuardService } from './typeGuard.service';
import * as chalk from 'chalk';

export const pathProvider = {
  provide: 'PATH_LIB',
  useValue: path,
};

export const chalkProvider = {
  provide: 'CHALK_LIB',
  useValue: chalk,
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
    chalkProvider,
    pathProvider,
    cryptoProvider,
    jwtProvider,
    fakerProvider,
    UtilityService,
    TypeGuardService,
  ],
  exports: [
    chalkProvider,
    pathProvider,
    cryptoProvider,
    jwtProvider,
    fakerProvider,
    UtilityService,
    TypeGuardService,
  ],
})
export class CommonModule {}
