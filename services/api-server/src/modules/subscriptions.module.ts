import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../../database/entities/subscription.entity';
import { SubscriptionsService } from '../../services/subscriptions.service';
import { SubscriptionsController } from '../../api/subscriptions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
