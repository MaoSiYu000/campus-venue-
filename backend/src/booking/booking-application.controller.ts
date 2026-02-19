import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BookingApplicationService } from './booking-application.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('booking-applications')
export class BookingApplicationController {
  constructor(private service: BookingApplicationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateBookingDto) {
    return this.service.create(user.id, dto);
  }

  @Get('check-availability')
  async checkAvailability(
    @Query('venue_id', ParseIntPipe) venueId: number,
    @Query('use_date') useDate: string,
    @Query('start_time') startTime: string,
    @Query('end_time') endTime: string,
  ) {
    return this.service.checkAvailability(venueId, useDate, startTime, endTime);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async myBookings(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findMyBookings(user.id);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('venue_admin')
  async pending(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findPendingForVenueAdmin(user.id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('venue_admin')
  async history(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findHistoryForVenueAdmin(user.id);
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('venue_admin')
  async overview(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getOverviewForVenueAdmin(user.id);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async all() {
    return this.service.findAllForSystemAdmin();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin', 'system_admin')
  async getOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const opts =
      user.role === 'user'
        ? { userId: user.id }
        : user.role === 'venue_admin'
          ? { venueAdminId: user.id }
          : { systemAdmin: true };
    return this.service.findOne(id, opts);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  async cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.cancel(id, user.id);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('venue_admin')
  async approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.service.approve(id, user.id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('venue_admin')
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RejectBookingDto,
  ) {
    return this.service.reject(id, user.id, dto.rejectReason);
  }
}
