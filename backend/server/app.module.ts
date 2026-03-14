import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from './modules/users.module';
import { DevicesModule } from './modules/devices.module';
import { TraccarModule } from './modules/traccar.module';
import { PositionsModule } from './modules/positions.module';
import { AlertsModule } from './modules/alerts.module';
import { CommandsModule } from './modules/commands.module';
import { SubscriptionsModule } from './modules/subscriptions.module';
import { BillingModule } from './modules/billing.module';
import { ClientsModule } from './modules/clients.module';
import { StatsModule } from './modules/stats.module';
import { ReportsModule } from './modules/reports.module';
import { GeofencesModule } from './modules/geofences.module';
import { RedisModule } from './modules/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'database',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USER || 'traccar',
      password: process.env.DB_PASSWORD || 'traccar',
      database: process.env.DB_NAME || 'traccar_db',
      entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
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
    ClientsModule,
    StatsModule,
    ReportsModule,
    GeofencesModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
