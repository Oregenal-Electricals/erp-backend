import { Module } from '@nestjs/common';
import { DummyDataController } from './dummy-data.controller';
import { DummyDataService } from './dummy-data.service';

@Module({
  controllers: [DummyDataController],
  providers: [DummyDataService],
})
export class DummyDataModule {}
