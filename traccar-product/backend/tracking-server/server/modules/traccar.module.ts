import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TraccarService } from '../../src/services/traccar.service';

@Module({
  imports: [ConfigModule],
  providers: [TraccarService],
  exports: [TraccarService],
})
export class TraccarModule {}
