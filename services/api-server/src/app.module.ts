import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackupService } from './services/backup.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users.module';
import { DevicesModule } from './modules/devices.module';
import { TraccarModule } from './modules/traccar.module';
import { PositionsModule } from './modules/positions.module';
import { AlertsModule } from './modules/alerts.module';
import { CommandsModule } from './modules/commands.module';
import { SubscriptionsModule } from './modules/subscriptions.module';
import { BillingModule } from './modules/billing.module';
import { StatsModule } from './modules/stats.module';
import { ReportsModule } from './modules/reports.module';
import { GeofencesModule } from './modules/geofences.module';
import { RedisModule } from './modules/redis.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MonitoringModule } from './modules/monitoring.module';
import { AuditModule } from './modules/audit.module';
import { TacticalModule } from './modules/tactical.module';
import { SettingsModule } from './modules/settings.module';
import { ShareModule } from './modules/share.module';
import { InvoiceModule } from './modules/invoice.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USER || 'traccar',
      password: process.env.DB_PASSWORD || 'traccar',
      database: process.env.DB_NAME || 'traccar_db',
      entities: [require('path').join(__dirname, 'database', 'entities', '*.entity{.ts,.js}')],
      migrations: [require('path').join(__dirname, 'database', 'migrations', '*{.ts,.js}')],
      migrationsRun: true,
      synchronize: false,
    }),
    AuthModule,
    UsersModule,
    DevicesModule,
    TraccarModule,
    PositionsModule,
    AlertsModule,
    CommandsModule,
    SubscriptionsModule,
    BillingModule,
    StatsModule,
    ReportsModule,
    GeofencesModule,
    RedisModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    MonitoringModule,
    AuditModule,
    TacticalModule,
    SettingsModule,
    ShareModule,
    InvoiceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BackupService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
