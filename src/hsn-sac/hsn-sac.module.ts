import { Module } from '@nestjs/common';
import { HsnSacController } from './hsn-sac.controller';
import { HsnSacService } from './hsn-sac.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [HsnSacController],
  providers: [HsnSacService],
  exports: [HsnSacService],
})
export class HsnSacModule {}
