import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../../src/database/entities/subscription.entity';
import { Plan } from '../../src/database/entities/plan.entity';
import { SubscriptionsService } from '../../src/services/subscriptions.service';
import { SubscriptionsController } from '../../src/api/subscriptions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
