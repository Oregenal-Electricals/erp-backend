import { Module } from '@nestjs/common';
import { MaterialIssueOverrideController } from './material-issue-override.controller';
import { MaterialIssueOverrideService } from './material-issue-override.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { ProductionMaterialReturnModule } from '../production-material-return/production-material-return.module';

@Module({
  imports: [PrismaModule, CommonModule, WorkflowsModule, ProductionMaterialReturnModule],
  controllers: [MaterialIssueOverrideController],
  providers: [MaterialIssueOverrideService],
  exports: [MaterialIssueOverrideService],
})
export class MaterialIssueOverrideModule {}
