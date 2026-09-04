import { Module } from '@nestjs/common';
import { ScrapController } from './scrap.controller';
import { ScrapService } from './scrap.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [ScrapController],
  providers: [ScrapService],
  exports: [ScrapService],
})
export class ScrapModule {}
