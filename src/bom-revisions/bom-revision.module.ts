import { Module } from '@nestjs/common';
import { BomRevisionController } from './bom-revision.controller';
import { BomRevisionService } from './bom-revision.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [BomRevisionController],
  providers: [BomRevisionService],
  exports: [BomRevisionService],
})
export class BomRevisionModule {}
