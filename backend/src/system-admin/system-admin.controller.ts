import { BadRequestException, Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile, Header, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SystemAdminService } from './system-admin.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdateScopeDto } from './dto/update-scope.dto';
import { ClearAccountsDto } from './dto/clear-accounts.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateVenueAdminDto } from './dto/create-venue-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('system-admin')
export class SystemAdminController {
  constructor(private service: SystemAdminService) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async users() {
    return this.service.getAllUsers();
  }

  @Get('venue-admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async venueAdmins() {
    return this.service.getAllVenueAdmins();
  }

  @Post('notify-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async notifyUser(@Body() dto: SendNotificationDto) {
    return this.service.sendNotificationToUser(dto.targetId, dto.title, dto.content);
  }

  @Post('notify-venue-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async notifyVenueAdmin(@Body() dto: SendNotificationDto) {
    return this.service.sendNotificationToVenueAdmin(dto.targetId, dto.title, dto.content);
  }

  @Post('venue-admins/:id/scope')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async updateScope(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateScopeDto) {
    return this.service.updateVenueAdminScope(id, dto.venueIds);
  }

  @Post('accounts/clear')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async clearAccounts(@Body() dto: ClearAccountsDto) {
    return this.service.clearAccounts({
      keepTestOnly: dto.keepTestOnly,
      clearAll: dto.clearAll,
      clearScope: dto.clearScope,
      userIds: dto.userIds,
      venueAdminIds: dto.venueAdminIds,
    });
  }

  @Post('accounts/ensure-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async ensureTestAccounts() {
    return this.service.ensureTestAccounts();
  }

  @Post('accounts/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async createUser(@Body() dto: CreateUserDto) {
    return this.service.createUser(dto);
  }

  @Post('accounts/venue-admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async createVenueAdmin(@Body() dto: CreateVenueAdminDto) {
    return this.service.createVenueAdmin(dto);
  }

  @Get('accounts/import-template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Header('Content-Disposition', 'attachment; filename="import-template.xlsx"')
  getImportTemplate(): StreamableFile {
    const buffer = this.service.getImportTemplateBuffer();
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  @Post('accounts/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @UseInterceptors(
      FileInterceptor('file', {
        limits: { fileSize: 5 * 1024 * 1024 },
        storage: memoryStorage(),
      }),
    )
  async importAccounts(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer) throw new BadRequestException('请上传 Excel 文件');
    return this.service.importAccountsFromBuffer(file.buffer);
  }
}
