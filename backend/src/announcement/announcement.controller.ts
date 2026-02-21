import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('announcements')
export class AnnouncementController {
  constructor(private service: AnnouncementService) {}

  @Get('must-read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin')
  async unreadMustRead(@CurrentUser() user: CurrentUserPayload) {
    const role = user.role as 'user' | 'venue_admin';
    return this.service.findUnreadMustRead(user.id, role);
  }

  @Get('must-read/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin')
  async readMustReadHistory(@CurrentUser() user: CurrentUserPayload) {
    const role = user.role as 'user' | 'venue_admin';
    return this.service.findReadMustRead(user.id, role);
  }

  @Post('mark-read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin')
  async markRead(
    @CurrentUser() user: CurrentUserPayload,
    @Body('announcementIds') announcementIds: number[],
  ) {
    const role = user.role as 'user' | 'venue_admin';
    await this.service.markAllRead(user.id, role, Array.isArray(announcementIds) ? announcementIds : [announcementIds]);
    return { message: 'ok' };
  }

  @Get()
  async list() {
    return this.service.findAll();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async myAnnouncements(@CurrentUser() user: CurrentUserPayload) {
    return this.service.findByCreatedBy(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateAnnouncementDto) {
    return this.service.create(dto.title, dto.content, dto.isMustRead, user.id, dto.targetRole);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.service.delete(id);
    return { message: '删除成功' };
  }
}
