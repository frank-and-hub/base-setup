import { Module } from '@nestjs/common';
import { GraphifyService } from './graphify.service';
import { GraphifyController } from './graphify.controller';

@Module({
  controllers: [GraphifyController],
  providers: [GraphifyService],
  exports: [GraphifyService],
})
export class GraphifyModule {}

