import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BookingApplication } from './entities/booking-application.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { VenueService } from '../venue/venue.service';
import { NotificationService } from '../notification/notification.service';
import { VenueUnavailableSlot } from '../venue/entities/venue-unavailable-slot.entity';
import { Venue } from '../venue/entities/venue.entity';

@Injectable()
export class BookingApplicationService {
  constructor(
    @InjectRepository(BookingApplication) private repo: Repository<BookingApplication>,
    @InjectRepository(VenueUnavailableSlot) private slotRepo: Repository<VenueUnavailableSlot>,
    private venueService: VenueService,
    private notificationService: NotificationService,
  ) {}

  async create(userId: number, dto: CreateBookingDto) {
    await this.venueService.findOne(dto.venueId);
    const slotStart = new Date(`${dto.useDate} ${dto.startTime}`);
    if (slotStart <= new Date()) {
      throw new BadRequestException('无法预约当前时间之前的场地，请选择未开始的时间段');
    }
    const conflict = await this.checkConflict(dto.venueId, dto.useDate, dto.startTime, dto.endTime, null);
    if (conflict) throw new BadRequestException('该时间段已被预约或不可用');
    const booking = this.repo.create({
      userId,
      venueId: dto.venueId,
      useDate: dto.useDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      activityName: dto.activityName,
      organizer: dto.organizer,
      estimatedPeople: dto.estimatedPeople,
      contactName: dto.contactName,
      contactPhone: dto.contactPhone,
      description: dto.description ?? null,
      proposalDocumentPath: dto.proposalDocumentPath ?? null,
      status: 'pending',
    });
    return this.repo.save(booking);
  }

  async checkConflict(venueId: number, useDate: string, startTime: string, endTime: string, excludeId: number | null) {
    const overlapping = await this.repo
      .createQueryBuilder('b')
      .where('b.venue_id = :venueId', { venueId })
      .andWhere('b.use_date = :useDate', { useDate })
      .andWhere('b.status IN (:...statuses)', { statuses: ['pending', 'approved'] })
      .andWhere(
        '(b.start_time < :endTime AND b.end_time > :startTime)',
        { startTime, endTime },
      )
      .getMany();
    if (excludeId) return overlapping.some((b: BookingApplication) => b.id !== excludeId);
    return overlapping.length > 0;
  }

  async checkAvailability(venueId: number, useDate: string, startTime: string, endTime: string) {
    const slotStart = new Date(`${useDate} ${startTime}`);
    if (slotStart <= new Date()) {
      return { available: false, conflict: false, hasUnavailableSlot: false, past: true };
    }
    const conflict = await this.checkConflict(venueId, useDate, startTime, endTime, null);
    const slots = await this.slotRepo
      .createQueryBuilder('s')
      .where('s.venue_id = :venueId', { venueId })
      .andWhere('s.start_time < :end', { end: `${useDate} ${endTime}` })
      .andWhere('s.end_time > :start', { start: `${useDate} ${startTime}` })
      .getMany();
    return { available: !conflict && slots.length === 0, conflict, hasUnavailableSlot: slots.length > 0, past: false };
  }

  async findMyBookings(userId: number) {
    return this.repo.find({
      where: { userId },
      relations: ['venue'],
      order: { useDate: 'DESC', startTime: 'DESC' },
    });
  }

  async findOne(id: number, options?: { userId?: number; venueAdminId?: number; systemAdmin?: boolean }) {
    const booking = await this.repo.findOne({
      where: { id },
      relations: ['venue', 'user', 'approvedByAdmin'],
    });
    if (!booking) throw new NotFoundException('预约不存在');
    if (options?.userId && booking.userId !== options.userId)
      throw new ForbiddenException('无权限查看');
    if (options?.venueAdminId && !options?.systemAdmin) {
      const venueIds = await this.venueService.findManagedByVenueAdmin(options.venueAdminId).then((venues: Venue[]) => venues.map((v: Venue) => v.id));
      if (!venueIds.includes(booking.venueId)) throw new ForbiddenException('无权限查看');
    }
    return booking;
  }

  async cancel(id: number, userId: number) {
    const booking = await this.findOne(id, { userId });
    if (booking.status !== 'pending' && booking.status !== 'approved')
      throw new BadRequestException('当前状态不可取消');
    const useDateTime = new Date(`${booking.useDate} ${booking.startTime}`);
    if (useDateTime <= new Date()) throw new BadRequestException('已开始或已过的预约不可取消');
    booking.status = 'cancelled';
    await this.repo.save(booking);
    return { message: '已取消' };
  }

  async findPendingByVenueIds(venueIds: number[]) {
    if (!venueIds.length) return [];
    return this.repo.find({
      where: { venueId: In(venueIds), status: 'pending' },
      relations: ['venue', 'user'],
      order: { createdAt: 'ASC' },
    });
  }

  async findHistoryByVenueIds(venueIds: number[]) {
    if (!venueIds.length) return [];
    return this.repo.find({
      where: { venueId: In(venueIds) },
      relations: ['venue', 'user', 'approvedByAdmin'],
      order: { createdAt: 'DESC' },
    });
  }

  async approve(id: number, venueAdminId: number) {
    const booking = await this.findOne(id, { venueAdminId });
    if (booking.status !== 'pending') throw new BadRequestException('仅待审核可通过');
    const venueIds = (await this.venueService.findManagedByVenueAdmin(venueAdminId)).map((v: Venue) => v.id);
    if (!venueIds.includes(booking.venueId)) throw new ForbiddenException('无权限审批该场地');
    booking.status = 'approved';
    booking.approvedBy = venueAdminId;
    booking.approvedAt = new Date();
    await this.repo.save(booking);
    await this.notificationService.create({
      targetType: 'user',
      targetId: booking.userId,
      title: '预约已通过',
      content: `您的场地预约「${booking.activityName}」已通过审核。`,
    });
    return booking;
  }

  async reject(id: number, venueAdminId: number, rejectReason: string) {
    const booking = await this.findOne(id, { venueAdminId });
    if (booking.status !== 'pending') throw new BadRequestException('仅待审核可驳回');
    const venueIds = (await this.venueService.findManagedByVenueAdmin(venueAdminId)).map((v: Venue) => v.id);
    if (!venueIds.includes(booking.venueId)) throw new ForbiddenException('无权限审批该场地');
    booking.status = 'rejected';
    booking.rejectReason = rejectReason;
    booking.approvedBy = venueAdminId;
    booking.approvedAt = new Date();
    await this.repo.save(booking);
    await this.notificationService.create({
      targetType: 'user',
      targetId: booking.userId,
      title: '预约已驳回',
      content: `您的场地预约「${booking.activityName}」已被驳回。原因：${rejectReason}`,
    });
    return booking;
  }

  async findAllForSystemAdmin() {
    return this.repo.find({
      relations: ['venue', 'user'],
      order: { useDate: 'DESC', startTime: 'DESC' },
    });
  }

  async getOverviewsByVenueIds(venueIds: number[]) {
    if (!venueIds.length) return [];
    return this.repo.find({
      where: { venueId: In(venueIds), status: In(['pending', 'approved']) },
      relations: ['venue', 'user'],
      order: { useDate: 'ASC', startTime: 'ASC' },
    });
  }

  async findPendingForVenueAdmin(venueAdminId: number) {
    const venues = await this.venueService.findManagedByVenueAdmin(venueAdminId);
    return this.findPendingByVenueIds(venues.map((v: Venue) => v.id));
  }

  async findHistoryForVenueAdmin(venueAdminId: number) {
    const venues = await this.venueService.findManagedByVenueAdmin(venueAdminId);
    return this.findHistoryByVenueIds(venues.map((v: Venue) => v.id));
  }

  async getOverviewForVenueAdmin(venueAdminId: number) {
    const venues = await this.venueService.findManagedByVenueAdmin(venueAdminId);
    return this.getOverviewsByVenueIds(venues.map((v: Venue) => v.id));
  }

  async deleteBySystemAdmin(id: number) {
    const booking = await this.repo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('预约不存在');
    await this.repo.remove(booking);
    return { message: '已删除' };
  }
}
