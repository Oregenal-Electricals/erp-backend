import { Module } from '@nestjs/common';
import { ArController } from './ar.controller';
import { ArService } from './ar.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { CustomerItemMappingModule } from '../customer-item-mapping/customer-item-mapping.module';

@Module({
  imports: [PrismaModule, CommonModule, CustomerItemMappingModule],
  controllers: [ArController],
  providers: [ArService],
  exports: [ArService],
})
export class ArModule {}
