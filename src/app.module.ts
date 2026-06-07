import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { MastersModule } from './masters/masters.module';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { SettingsModule } from './settings/settings.module';
import { ChangeRequestsModule } from './change-requests/change-requests.module';
import { DummyDataModule } from './dummy-data/dummy-data.module';
import { VisitorManagementModule } from './visitor-management/visitor-management.module';
import { VehicleManagementModule } from './vehicle-management/vehicle-management.module';
import { GateInwardModule } from './gate-inward/gate-inward.module';
import { GateOutwardModule } from './gate-outward/gate-outward.module';
import { GatePassModule } from './gate-pass/gate-pass.module';
import { GateDashboardModule } from './gate-dashboard/gate-dashboard.module';
import { ItemMasterModule } from './item-master/item-master.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { VendorModule } from './vendors/vendor.module';
import { ProductModule } from './products/product.module';
import { RawMaterialModule } from './raw-materials/raw-material.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], envFilePath: ['.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule, CommonModule, HealthModule, AuthModule,
    MastersModule, UsersModule, PermissionsModule, SettingsModule,
    ChangeRequestsModule, DummyDataModule,
    VisitorManagementModule, VehicleManagementModule,
    GateInwardModule, GateOutwardModule, GatePassModule,
    GateDashboardModule, ItemMasterModule, WarehouseModule,
    VendorModule,
    ProductModule,
    RawMaterialModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
