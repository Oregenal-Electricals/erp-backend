import { Module } from '@nestjs/common';
import { ItemMasterController } from './item-master.controller';
import { ItemMasterService } from './item-master.service';

@Module({
  controllers: [ItemMasterController],
  providers: [ItemMasterService],
  exports: [ItemMasterService],
})
export class ItemMasterModule {}
