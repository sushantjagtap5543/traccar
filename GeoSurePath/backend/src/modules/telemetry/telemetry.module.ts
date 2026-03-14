import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelemetryGateway } from './telemetry.gateway';
import { TelemetryService } from './telemetry.service';
import { TraccarModule } from '../traccar/traccar.module';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [
    TraccarModule,
    VehiclesModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'geosurepath_secret_key',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TelemetryGateway, TelemetryService],
  exports: [TelemetryGateway, TelemetryService],
})
export class TelemetryModule {}
