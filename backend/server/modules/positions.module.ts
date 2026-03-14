import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PositionsGateway } from './positions.gateway';
import { PositionsService } from './positions.service';
import { TraccarModule } from '../traccar/traccar.module';
import { DevicesModule } from '../devices/devices.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    TraccarModule,
    DevicesModule,
    forwardRef(() => AlertsModule),
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
  providers: [PositionsGateway, PositionsService],
  exports: [PositionsGateway, PositionsService],
})
export class PositionsModule {}
