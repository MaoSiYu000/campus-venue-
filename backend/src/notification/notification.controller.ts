import { Controller, Get, Post, Delete, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(private service: NotificationService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin')
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('unread_only') unreadOnly?: string,
  ) {
    const targetType = user.role === 'user' ? 'user' : 'venue_admin';
    return this.service.findByTarget(targetType, user.id, unreadOnly === 'true');
  }

  @Post('mark-read/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin')
  async markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    const targetType = user.role === 'user' ? 'user' : 'venue_admin';
    await this.service.markRead(id, targetType, user.id);
    return { message: 'ok' };
  }

  @Post('mark-all-read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin')
  async markAllRead(@CurrentUser() user: CurrentUserPayload) {
    const targetType = user.role === 'user' ? 'user' : 'venue_admin';
    await this.service.markAllRead(targetType, user.id);
    return { message: 'ok' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user', 'venue_admin')
  async deleteOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    const targetType = user.role === 'user' ? 'user' : 'venue_admin';
    await this.service.deleteOne(id, targetType, user.id);
    return { message: 'ok' };
  }
}
