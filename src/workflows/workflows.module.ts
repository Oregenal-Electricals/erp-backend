import { Module, forwardRef } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { BomModule } from '../bom/bom.module';
import { ProductModule } from '../products/product.module';

@Module({
  imports: [PrismaModule, CommonModule, forwardRef(() => BomModule), forwardRef(() => ProductModule)],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
