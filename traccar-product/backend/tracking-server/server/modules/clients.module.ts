import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../../src/database/entities/client.entity';
import { ClientsService } from '../../src/services/clients.service';
import { ClientsController } from '../../src/api/clients.controller';
import { UsersModule } from './users.module';
import { SubscriptionsModule } from './subscriptions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Client]), UsersModule, SubscriptionsModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
