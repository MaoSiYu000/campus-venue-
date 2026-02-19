import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemAdminController } from './system-admin.controller';
import { SystemAdminService } from './system-admin.service';
import { SystemAdmin } from './entities/system-admin.entity';
import { User } from '../user/entities/user.entity';
import { VenueAdmin } from '../venue-admin/entities/venue-admin.entity';
import { Venue } from '../venue/entities/venue.entity';
import { BookingApplication } from '../booking/entities/booking-application.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemAdmin, User, VenueAdmin, Venue, BookingApplication]),
    NotificationModule,
  ],
  controllers: [SystemAdminController],
  providers: [SystemAdminService],
})
export class SystemAdminModule {}
