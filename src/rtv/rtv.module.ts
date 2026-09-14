import { Module } from '@nestjs/common';
import { RtvController } from './rtv.controller';
import { RtvService } from './rtv.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [RtvController],
  providers: [RtvService],
  exports: [RtvService],
})
export class RtvModule {}
