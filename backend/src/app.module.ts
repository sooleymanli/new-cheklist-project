import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { InfrastructureModule } from './infrastructure';
import { HealthModule } from './common/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UsersModule } from './modules/users/users.module';
import { BuildingsModule } from './modules/buildings/buildings.module';
import { FloorsModule } from './modules/floors/floors.module';
import { LocationsModule } from './modules/locations/locations.module';
import { QrModule } from './modules/qr/qr.module';
import { FilesModule } from './modules/files/files.module';
import { ChecklistTemplatesModule } from './modules/checklist-templates/checklist-templates.module';
import { ChecklistSchedulesModule } from './modules/checklist-schedules/checklist-schedules.module';
import { ChecklistAssignmentsModule } from './modules/checklist-assignments/checklist-assignments.module';
import { ChecklistInstancesModule } from './modules/checklist-instances/checklist-instances.module';
import { InspectionAssignmentsModule } from './modules/inspection-assignments/inspection-assignments.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './modules/auth/guards/permissions.guard';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  minioConfig,
} from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, minioConfig],
    }),
    ScheduleModule.forRoot(),
    InfrastructureModule,
    HealthModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    UsersModule,
    BuildingsModule,
    FloorsModule,
    LocationsModule,
    QrModule,
    FilesModule,
    ChecklistTemplatesModule,
    ChecklistSchedulesModule,
    ChecklistAssignmentsModule,
    ChecklistInstancesModule,
    InspectionAssignmentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
