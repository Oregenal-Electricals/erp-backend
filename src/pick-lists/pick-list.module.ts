import { Module } from '@nestjs/common';
import { PickListController } from './pick-list.controller';
import { PickListService } from './pick-list.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PickListController],
  providers: [PickListService],
  exports: [PickListService],
})
export class PickListModule {}
