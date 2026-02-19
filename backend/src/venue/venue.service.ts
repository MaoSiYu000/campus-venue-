import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Venue } from './entities/venue.entity';
import { VenueUnavailableSlot } from './entities/venue-unavailable-slot.entity';
import { VenueAdmin } from '../venue-admin/entities/venue-admin.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { CreateUnavailableSlotDto } from './dto/create-unavailable-slot.dto';
import { NotificationService } from '../notification/notification.service';
import { BookingApplication } from '../booking/entities/booking-application.entity';

const VENUE_TYPES = ['report_hall', 'meeting_room', 'activity_center'] as const;
const DEFAULT_VENUES: { venueType: string; name: string; location: string; address: string }[] = [
  { venueType: 'report_hall', name: '第一报告厅', location: '教学楼A栋', address: '教学楼A栋3层301' },
  { venueType: 'meeting_room', name: '第二会议室', location: '行政楼', address: '行政楼2层201' },
  { venueType: 'activity_center', name: '学生活动中心', location: '校园中心', address: '校园中心1层' },
];

@Injectable()
export class VenueService {
  constructor(
    @InjectRepository(Venue) private venueRepo: Repository<Venue>,
    @InjectRepository(VenueUnavailableSlot) private slotRepo: Repository<VenueUnavailableSlot>,
    @InjectRepository(VenueAdmin) private venueAdminRepo: Repository<VenueAdmin>,
    @InjectRepository(BookingApplication) private bookingRepo: Repository<BookingApplication>,
    private notificationService: NotificationService,
  ) {}

  async findAll(filters: {
    venueType?: string;
    minCapacity?: number;
    maxCapacity?: number;
    location?: string;
    hasProjector?: boolean;
    hasSound?: boolean;
    isAvailable?: boolean;
    excludeBookedDate?: string;
    excludeBookedStart?: string;
    excludeBookedEnd?: string;
  }) {
    const qb = this.venueRepo.createQueryBuilder('v').where('1=1');
    if (filters.venueType) qb.andWhere('v.venueType = :venueType', { venueType: filters.venueType });
    if (filters.minCapacity != null) qb.andWhere('v.capacity >= :minCapacity', { minCapacity: filters.minCapacity });
    if (filters.maxCapacity != null) qb.andWhere('v.capacity <= :maxCapacity', { maxCapacity: filters.maxCapacity });
    if (filters.location) qb.andWhere('v.location LIKE :location', { location: `%${filters.location}%` });
    if (filters.hasProjector !== undefined) qb.andWhere('v.hasProjector = :hp', { hp: filters.hasProjector ? 1 : 0 });
    if (filters.hasSound !== undefined) qb.andWhere('v.hasSound = :hs', { hs: filters.hasSound ? 1 : 0 });
    if (filters.isAvailable !== undefined) qb.andWhere('v.isAvailable = :av', { av: filters.isAvailable ? 1 : 0 });

    const list = await qb.getMany();
    if (filters.excludeBookedDate && filters.excludeBookedStart != null && filters.excludeBookedEnd != null) {
      const excludeStart = filters.excludeBookedStart;
      const excludeEnd = filters.excludeBookedEnd;
      const booked = await this.venueRepo.manager
        .getRepository(BookingApplication)
        .find({
          where: {
            useDate: filters.excludeBookedDate,
            status: In(['pending', 'approved']),
          },
        });
      const bookedVenueIds = new Set(
        booked
          .filter(
            (b) =>
              (b.startTime <= excludeEnd && b.endTime >= excludeStart),
          )
          .map((b) => b.venueId),
      );
      return list.filter((v) => !bookedVenueIds.has(v.id));
    }
    return list;
  }

  async findOne(id: number) {
    const venue = await this.venueRepo.findOne({ where: { id } });
    if (!venue) throw new NotFoundException('场地不存在');
    return venue;
  }

  async findManagedByVenueAdmin(adminId: number) {
    const admin = await this.venueAdminRepo.findOne({
      where: { id: adminId },
      relations: ['venues'],
    });
    if (!admin) return [];
    return admin.venues || [];
  }

  async findByIds(ids: number[]) {
    if (!ids.length) return [];
    return this.venueRepo.find({ where: { id: In(ids) } });
  }

  async create(dto: CreateVenueDto) {
    const venue = this.venueRepo.create({
      name: dto.name,
      venueType: dto.venueType,
      capacity: dto.capacity,
      location: dto.location ?? null,
      address: dto.address ?? null,
      openTime: dto.openTime ?? null,
      closeTime: dto.closeTime ?? null,
      hasProjector: dto.hasProjector ? 1 : 0,
      hasSound: dto.hasSound ? 1 : 0,
      isAvailable: dto.isAvailable !== false ? 1 : 0,
      photos: dto.photos ?? null,
    });
    return this.venueRepo.save(venue);
  }

  async update(id: number, dto: UpdateVenueDto, isSystemAdmin: boolean, venueAdminId?: number) {
    const venue = await this.findOne(id);
    if (!isSystemAdmin && venueAdminId != null) {
      const [row] = await this.venueRepo.manager.query(
        'SELECT 1 FROM venue_admin_venue WHERE venue_admin_id = ? AND venue_id = ? LIMIT 1',
        [venueAdminId, id],
      );
      if (!row) throw new ForbiddenException('无权限修改该场地');
    }
    if (dto.isAvailable === false && venue.isAvailable === 1) {
      await this.notifyVenueUnavailable(venue.id, '场地已设为不可用');
    }
    Object.assign(venue, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.venueType !== undefined && { venueType: dto.venueType }),
      ...(dto.capacity !== undefined && { capacity: dto.capacity }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.openTime !== undefined && { openTime: dto.openTime }),
      ...(dto.closeTime !== undefined && { closeTime: dto.closeTime }),
      ...(dto.hasProjector !== undefined && { hasProjector: dto.hasProjector ? 1 : 0 }),
      ...(dto.hasSound !== undefined && { hasSound: dto.hasSound ? 1 : 0 }),
      ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable ? 1 : 0 }),
      ...(dto.photos !== undefined && { photos: dto.photos }),
    });
    return this.venueRepo.save(venue);
  }

  async addUnavailableSlot(venueId: number, dto: CreateUnavailableSlotDto, venueAdminId?: number, isSystemAdmin = false) {
    const venue = await this.findOne(venueId);
    if (!isSystemAdmin && venueAdminId != null) {
      const [row] = await this.venueRepo.manager.query(
        'SELECT 1 FROM venue_admin_venue WHERE venue_admin_id = ? AND venue_id = ? LIMIT 1',
        [venueAdminId, venueId],
      );
      if (!row) throw new ForbiddenException('无权限');
    }
    const slot = this.slotRepo.create({
      venueId,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      reason: dto.reason ?? null,
    });
    const saved = await this.slotRepo.save(slot);
    await this.notifyVenueUnavailable(venueId, dto.reason || '该时段已设为不可用', dto.startTime, dto.endTime);
    return saved;
  }

  async getUnavailableSlots(venueId: number) {
    return this.slotRepo.find({
      where: { venueId },
      order: { startTime: 'ASC' },
    });
  }

  /** 确保每种类型至少有一个测试场地，不存在则创建 */
  async ensureTestVenues(): Promise<{ created: number }> {
    let created = 0;
    for (const def of DEFAULT_VENUES) {
      const existing = await this.venueRepo.findOne({ where: { venueType: def.venueType } });
      if (!existing) {
        await this.venueRepo.insert({
          name: def.name,
          venueType: def.venueType,
          capacity: 50,
          location: def.location,
          address: def.address,
          hasProjector: 0,
          hasSound: 0,
          isAvailable: 1,
        });
        created++;
      }
    }
    return { created };
  }

  /** 清空场地：保留测试（每类保留一个）/ 完全清空 / 按 id 删除 */
  async clearVenues(opts: { keepTestOnly?: boolean; clearAll?: boolean; venueIds?: number[] }) {
    if (opts.keepTestOnly) {
      const toDelete: number[] = [];
      for (const vt of VENUE_TYPES) {
        const all = await this.venueRepo.find({ where: { venueType: vt }, order: { id: 'ASC' }, select: ['id'] });
        if (all.length > 1) toDelete.push(...all.slice(1).map((v) => v.id));
        else if (all.length === 1) { /* keep */ }
        else { /* none */ }
      }
      await this.deleteVenuesByIds(toDelete);
      return { message: '已清空，仅保留每类一个测试场地', deleted: toDelete.length };
    }
    if (opts.clearAll) {
      const all = await this.venueRepo.find({ select: ['id'] });
      await this.deleteVenuesByIds(all.map((v) => v.id));
      return { message: '已完全清空所有场地', deleted: all.length };
    }
    if (opts.venueIds?.length) {
      await this.deleteVenuesByIds(opts.venueIds);
      return { message: '已删除所选场地', deleted: opts.venueIds.length };
    }
    throw new BadRequestException('请指定 keepTestOnly、clearAll 或 venueIds');
  }

  private async deleteVenuesByIds(venueIds: number[]) {
    if (!venueIds.length) return;
    await this.bookingRepo.delete({ venueId: In(venueIds) });
    await this.slotRepo.delete({ venueId: In(venueIds) });
    await this.venueRepo.manager.query(
      `DELETE FROM venue_admin_venue WHERE venue_id IN (${venueIds.map(() => '?').join(',')})`,
      venueIds,
    );
    await this.venueRepo.delete(venueIds);
  }

  getVenueTemplateBuffer(): Buffer {
    const xlsx = require('xlsx');
    const wb = xlsx.utils.book_new();
    const header = ['名称', '类型', '容量', '位置', '地址', '开放时间', '关闭时间', '投影', '音响', '可用'];
    const typesDesc = 'report_hall=报告厅, meeting_room=会议室, activity_center=活动中心';
    const row1 = ['第一报告厅', 'report_hall', 100, '教学楼A栋', 'A栋301', '08:00', '22:00', 1, 1, 1];
    const ws = xlsx.utils.aoa_to_sheet([header, row1, [typesDesc, '', '', '', '', '', '', '', '', '']]);
    xlsx.utils.book_append_sheet(wb, ws, '场地');
    const out = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.isBuffer(out) ? out : Buffer.from(out);
  }

  async importVenuesFromBuffer(buffer: Buffer): Promise<{ created: number; errors: string[] }> {
    const xlsx = await import('xlsx');
    const book = xlsx.read(buffer, { type: 'buffer' });
    const errors: string[] = [];
    let created = 0;
    const sheetName = book.SheetNames.find((n) => n === '场地') || book.SheetNames[0];
    const ws = book.Sheets[sheetName];
    if (!ws) return { created: 0, errors: ['未找到「场地」工作表'] };
    const data = xlsx.utils.sheet_to_json<Record<string, string | number>>(ws, { header: 1, defval: '' }) as unknown as (string | number)[][];
    if (data.length < 2) return { created: 0, errors: [] };
    const header = (data[0] || []).map((h) => String(h).trim());
    const col = (key: string) => {
      const i = header.findIndex((h) => h === key || h.includes(key));
      return i >= 0 ? i : -1;
    };
    const idxName = col('名称');
    const idxType = col('类型');
    const idxCapacity = col('容量');
    if (idxName < 0 || idxType < 0 || idxCapacity < 0) {
      errors.push('表头需包含：名称、类型、容量');
      return { created: 0, errors };
    }
    const idxLoc = col('位置');
    const idxAddr = col('地址');
    const idxOpen = col('开放时间');
    const idxClose = col('关闭时间');
    const idxProj = col('投影');
    const idxSound = col('音响');
    const idxAvail = col('可用');
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as (string | number)[];
      if (!row || row.length === 0) continue;
      const name = String(row[idxName] ?? '').trim();
      const venueType = String(row[idxType] ?? '').trim();
      if (!name || !venueType) continue;
      if (!VENUE_TYPES.includes(venueType as any)) {
        errors.push(`第${i + 1}行：类型必须是 report_hall / meeting_room / activity_center 之一`);
        continue;
      }
      const capacity = Math.max(0, parseInt(String(row[idxCapacity] ?? 0), 10) || 0);
      const location = idxLoc >= 0 ? String(row[idxLoc] ?? '').trim() || null : null;
      const address = idxAddr >= 0 ? String(row[idxAddr] ?? '').trim() || null : null;
      const openTime = idxOpen >= 0 ? String(row[idxOpen] ?? '').trim() || null : null;
      const closeTime = idxClose >= 0 ? String(row[idxClose] ?? '').trim() || null : null;
      const hasProjector = idxProj >= 0 ? (Number(row[idxProj]) ? 1 : 0) : 0;
      const hasSound = idxSound >= 0 ? (Number(row[idxSound]) ? 1 : 0) : 0;
      const isAvailable = idxAvail >= 0 ? (Number(row[idxAvail]) ? 1 : 0) : 1;
      try {
        await this.venueRepo.insert({
          name,
          venueType,
          capacity,
          location,
          address,
          openTime,
          closeTime,
          hasProjector,
          hasSound,
          isAvailable,
        });
        created++;
      } catch (e: any) {
        errors.push(`第${i + 1}行 ${name}: ${e?.message || '插入失败'}`);
      }
    }
    return { created, errors };
  }

  private async notifyVenueUnavailable(
    venueId: number,
    reason: string,
    start?: string,
    end?: string,
  ) {
    const bookingRepo = this.venueRepo.manager.getRepository(BookingApplication);
    const venue = await this.venueRepo.findOne({ where: { id: venueId } });
    const venueName = venue?.name ?? '该场地';
    const bookings = await bookingRepo.find({
      where: { venueId, status: In(['pending', 'approved']) },
      relations: ['user'],
    });
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    const rejectReason = reason || '场地不可用';
    for (const b of bookings) {
      const useStart = new Date(`${b.useDate} ${b.startTime}`);
      const useEnd = new Date(`${b.useDate} ${b.endTime}`);
      if (startDate && endDate && (useStart >= endDate || useEnd <= startDate)) continue;
      b.status = 'rejected';
      b.rejectReason = rejectReason;
      await bookingRepo.save(b);
      await this.notificationService.create({
        targetType: 'user',
        targetId: b.userId,
        title: '预约驳回通知',
        content: '您预约的场地「' + venueName + '」因「' + rejectReason + '」已被驳回。驳回理由：' + rejectReason,
      });
    }
  }
}
