import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { VenueModule } from './venue/venue.module';
import { BookingModule } from './booking/booking.module';
import { AnnouncementModule } from './announcement/announcement.module';
import { NotificationModule } from './notification/notification.module';
import { UserModule } from './user/user.module';
import { SystemAdminModule } from './system-admin/system-admin.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'campus_venue',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      charset: 'utf8mb4',
      extra: { charset: 'utf8mb4' },
    }),
    AuthModule,
    UserModule,
    VenueModule,
    BookingModule,
    AnnouncementModule,
    NotificationModule,
    SystemAdminModule,
    UploadModule,
  ],
})
export class AppModule {}
