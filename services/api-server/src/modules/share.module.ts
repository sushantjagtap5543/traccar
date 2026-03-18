import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareToken } from '../database/entities/share-token.entity';
import { ShareService } from '../services/share.service';
import { ShareController } from '../api/share.controller';
import { DevicesModule } from './devices.module';
import { TraccarModule } from './traccar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShareToken]),
    DevicesModule,
    TraccarModule,
  ],
  providers: [ShareService],
  controllers: [ShareController],
  exports: [ShareService],
})
export class ShareModule {}
