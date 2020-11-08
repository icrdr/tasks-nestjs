import { Module } from '@nestjs/common';
import path from 'path';

@Module({
  providers: [
    {
      provide: 'PATH',
      useFactory: () => {
        return path;
      },
    },
  ],
  exports:['PATH']
})
export class CommonModule {}
