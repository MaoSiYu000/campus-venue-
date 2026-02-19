import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementController } from './announcement.controller';
import { AnnouncementService } from './announcement.service';
import { Announcement } from './entities/announcement.entity';
import { UserAnnouncementRead } from './entities/user-announcement-read.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Announcement, UserAnnouncementRead])],
  controllers: [AnnouncementController],
  providers: [AnnouncementService],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
