import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingApplicationController } from './booking-application.controller';
import { BookingApplicationService } from './booking-application.service';
import { BookingApplication } from './entities/booking-application.entity';
import { VenueUnavailableSlot } from '../venue/entities/venue-unavailable-slot.entity';
import { VenueModule } from '../venue/venue.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingApplication, VenueUnavailableSlot]),
    VenueModule,
    NotificationModule,
  ],
  controllers: [BookingApplicationController],
  providers: [BookingApplicationService],
  exports: [BookingApplicationService],
})
export class BookingModule {}
