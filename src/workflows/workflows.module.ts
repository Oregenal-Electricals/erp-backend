import { Module, forwardRef } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { BomModule } from '../bom/bom.module';
import { ProductModule } from '../products/product.module';
import { CustomerItemMappingModule } from '../customer-item-mapping/customer-item-mapping.module';

@Module({
  imports: [PrismaModule, CommonModule, forwardRef(() => BomModule), forwardRef(() => ProductModule), forwardRef(() => CustomerItemMappingModule)],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
