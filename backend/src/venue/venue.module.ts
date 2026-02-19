import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenueController } from './venue.controller';
import { VenueService } from './venue.service';
import { Venue } from './entities/venue.entity';
import { VenueUnavailableSlot } from './entities/venue-unavailable-slot.entity';
import { VenueAdmin } from '../venue-admin/entities/venue-admin.entity';
import { BookingApplication } from '../booking/entities/booking-application.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venue, VenueUnavailableSlot, VenueAdmin, BookingApplication]),
    NotificationModule,
  ],
  controllers: [VenueController],
  providers: [VenueService],
  exports: [VenueService],
})
export class VenueModule {}
