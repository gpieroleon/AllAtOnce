import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { StatsService } from './stats.service';
import { UsersAdminService } from './users-admin.service';
import { OrdersModule } from '../orders/orders.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [OrdersModule, ReviewsModule],
  controllers: [AdminController],
  providers: [StatsService, UsersAdminService],
})
export class AdminModule {}
