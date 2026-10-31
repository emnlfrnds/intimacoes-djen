import { Module } from '@nestjs/common';
import { DjenClient } from './djen.client.js';

@Module({
  providers: [DjenClient],
  exports: [DjenClient],
})
export class DjenModule {}
