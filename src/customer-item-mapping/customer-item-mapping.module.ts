import { Module, forwardRef } from '@nestjs/common';
import { CustomerItemMappingController } from './customer-item-mapping.controller';
import { CustomerItemMappingService } from './customer-item-mapping.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [PrismaModule, CommonModule, forwardRef(() => WorkflowsModule)],
  controllers: [CustomerItemMappingController],
  providers: [CustomerItemMappingService],
  exports: [CustomerItemMappingService],
})
export class CustomerItemMappingModule {}
