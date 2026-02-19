import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Header,
  StreamableFile,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { VenueService } from './venue.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { CreateUnavailableSlotDto } from './dto/create-unavailable-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('venues')
export class VenueController {
  constructor(private venueService: VenueService) {}

  @Get('managed/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('venue_admin')
  async managedList(@CurrentUser() user: CurrentUserPayload) {
    return this.venueService.findManagedByVenueAdmin(user.id);
  }

  @Get()
  async list(
    @Query('venue_type') venueType?: string,
    @Query('min_capacity') minCapacity?: string,
    @Query('max_capacity') maxCapacity?: string,
    @Query('location') location?: string,
    @Query('has_projector') hasProjector?: string,
    @Query('has_sound') hasSound?: string,
    @Query('is_available') isAvailable?: string,
    @Query('exclude_booked_date') excludeBookedDate?: string,
    @Query('exclude_booked_start') excludeBookedStart?: string,
    @Query('exclude_booked_end') excludeBookedEnd?: string,
  ) {
    const filters: Record<string, unknown> = {};
    if (venueType) filters.venueType = venueType;
    if (minCapacity != null && minCapacity !== '') filters.minCapacity = parseInt(minCapacity, 10);
    if (maxCapacity != null && maxCapacity !== '') filters.maxCapacity = parseInt(maxCapacity, 10);
    if (location) filters.location = location;
    if (hasProjector === 'true' || hasProjector === '1') filters.hasProjector = true;
    if (hasProjector === 'false' || hasProjector === '0') filters.hasProjector = false;
    if (hasSound === 'true' || hasSound === '1') filters.hasSound = true;
    if (hasSound === 'false' || hasSound === '0') filters.hasSound = false;
    if (isAvailable === 'true' || isAvailable === '1') filters.isAvailable = true;
    if (isAvailable === 'false' || isAvailable === '0') filters.isAvailable = false;
    if (excludeBookedDate) filters.excludeBookedDate = excludeBookedDate;
    if (excludeBookedStart) filters.excludeBookedStart = excludeBookedStart;
    if (excludeBookedEnd) filters.excludeBookedEnd = excludeBookedEnd;
    return this.venueService.findAll(filters as any);
  }

  @Get('import-template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @Header('Content-Disposition', 'attachment; filename="venue-import-template.xlsx"')
  getImportTemplate(): StreamableFile {
    const buffer = this.venueService.getVenueTemplateBuffer();
    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.venueService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async create(@Body() dto: CreateVenueDto) {
    return this.venueService.create(dto);
  }

  @Post('ensure-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async ensureTestVenues() {
    return this.venueService.ensureTestVenues();
  }

  @Post('clear')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  async clearVenues(
    @Body() body: { keepTestOnly?: boolean; clearAll?: boolean; venueIds?: number[] },
  ) {
    return this.venueService.clearVenues(body);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('system_admin')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      storage: memoryStorage(),
    }),
  )
  async importVenues(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer) throw new BadRequestException('请上传 Excel 文件');
    return this.venueService.importVenuesFromBuffer(file.buffer);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('venue_admin', 'system_admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVenueDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const isSystemAdmin = user.role === 'system_admin';
    return this.venueService.update(id, dto, isSystemAdmin, user.role === 'venue_admin' ? user.id : undefined);
  }

  @Post(':id/unavailable-slots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('venue_admin', 'system_admin')
  async addUnavailableSlot(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateUnavailableSlotDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const isSystemAdmin = user.role === 'system_admin';
    return this.venueService.addUnavailableSlot(id, dto, user.role === 'venue_admin' ? user.id : undefined, isSystemAdmin);
  }

  @Get(':id/unavailable-slots')
  async getUnavailableSlots(@Param('id', ParseIntPipe) id: number) {
    return this.venueService.getUnavailableSlots(id);
  }
}
