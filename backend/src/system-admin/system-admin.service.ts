import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../user/entities/user.entity';
import { VenueAdmin } from '../venue-admin/entities/venue-admin.entity';
import { Venue } from '../venue/entities/venue.entity';
import { BookingApplication } from '../booking/entities/booking-application.entity';
import { NotificationService } from '../notification/notification.service';
import { OnModuleInit } from '@nestjs/common';

const TEST_STUDENT_ID = '2024001';
const TEST_VENUE_ADMIN_WORK_ID = 'va001';
const DEFAULT_TEST_PASSWORD = '123456';
const TEST_USER_NAME = '测试学生';
const TEST_VA_NAME = '张管理员';

@Injectable()
export class SystemAdminService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(VenueAdmin) private venueAdminRepo: Repository<VenueAdmin>,
    @InjectRepository(Venue) private venueRepo: Repository<Venue>,
    @InjectRepository(BookingApplication) private bookingRepo: Repository<BookingApplication>,
    private notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    await this.ensureTestAccounts();
  }

  /** 确保测试账号存在（学号 2024001、工号 va001），不存在则创建 */
  async ensureTestAccounts(): Promise<{ userCreated: boolean; venueAdminCreated: boolean }> {
    const hash = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
    let userCreated = false;
    let venueAdminCreated = false;
    const existingUser = await this.userRepo.findOne({ where: { studentId: TEST_STUDENT_ID } });
    if (!existingUser) {
      await this.userRepo.insert({
        studentId: TEST_STUDENT_ID,
        passwordHash: hash,
        name: TEST_USER_NAME,
        mustChangePassword: 1,
      });
      userCreated = true;
    }
    const existingVa = await this.venueAdminRepo.findOne({ where: { workId: TEST_VENUE_ADMIN_WORK_ID } });
    if (!existingVa) {
      await this.venueAdminRepo.insert({
        workId: TEST_VENUE_ADMIN_WORK_ID,
        passwordHash: hash,
        name: TEST_VA_NAME,
      });
      venueAdminCreated = true;
    }
    return { userCreated, venueAdminCreated };
  }

  async getAllUsers() {
    return this.userRepo.find({ order: { id: 'ASC' } });
  }

  async getAllVenueAdmins() {
    return this.venueAdminRepo.find({
      relations: ['venues'],
      order: { id: 'ASC' },
    });
  }

  async createUser(dto: { studentId: string; name?: string; password?: string }) {
    const studentId = dto.studentId.trim();
    if (!studentId) throw new BadRequestException('学号不能为空');
    const existing = await this.userRepo.findOne({ where: { studentId } });
    if (existing) throw new BadRequestException(`学号 ${studentId} 已存在`);
    const pwd = dto.password?.trim();
    const passwordHash =
      pwd && pwd.length >= 6 ? await bcrypt.hash(pwd, 10) : await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
    await this.userRepo.insert({
      studentId,
      passwordHash,
      name: dto.name?.trim() || null,
      mustChangePassword: 1,
    });
    return this.userRepo.findOne({ where: { studentId } });
  }

  async createVenueAdmin(dto: { workId: string; name?: string; password?: string }) {
    const workId = dto.workId.trim();
    if (!workId) throw new BadRequestException('工号不能为空');
    const existing = await this.venueAdminRepo.findOne({ where: { workId } });
    if (existing) throw new BadRequestException(`工号 ${workId} 已存在`);
    const pwd = dto.password?.trim();
    const passwordHash =
      pwd && pwd.length >= 6 ? await bcrypt.hash(pwd, 10) : await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);
    await this.venueAdminRepo.insert({
      workId,
      passwordHash,
      name: dto.name?.trim() || null,
    });
    return this.venueAdminRepo.findOne({ where: { workId } });
  }

  async sendNotificationToUser(userId: number, title: string, content: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    return this.notificationService.create({
      targetType: 'user',
      targetId: userId,
      title,
      content,
    });
  }

  async sendNotificationToVenueAdmin(venueAdminId: number, title: string, content: string) {
    const admin = await this.venueAdminRepo.findOne({ where: { id: venueAdminId } });
    if (!admin) throw new NotFoundException('场地管理员不存在');
    return this.notificationService.create({
      targetType: 'venue_admin',
      targetId: venueAdminId,
      title,
      content,
    });
  }

  async updateVenueAdminScope(venueAdminId: number, venueIds: number[]) {
    const admin = await this.venueAdminRepo.findOne({
      where: { id: venueAdminId },
      relations: ['venues'],
    });
    if (!admin) throw new NotFoundException('场地管理员不存在');
    admin.venues = venueIds.length
      ? await this.venueRepo.find({ where: { id: In(venueIds) } })
      : [];
    await this.venueAdminRepo.save(admin);
    return admin;
  }

  async clearAccounts(opts: {
    keepTestOnly?: boolean;
    clearAll?: boolean;
    clearScope?: 'users' | 'venue_admins' | 'both';
    userIds?: number[];
    venueAdminIds?: number[];
  }) {
    const scope = opts.clearScope || 'both';
    if (opts.keepTestOnly) {
      const keepUser = await this.userRepo.findOne({ where: { studentId: TEST_STUDENT_ID } });
      const keepVa = await this.venueAdminRepo.findOne({ where: { workId: TEST_VENUE_ADMIN_WORK_ID } });
      let userIdsToDelete: number[] = [];
      let vaIdsToDelete: number[] = [];
      if (scope === 'users' || scope === 'both') {
        userIdsToDelete = (await this.userRepo.find({ where: {} }))
          .filter((u) => u.studentId !== TEST_STUDENT_ID)
          .map((u) => u.id);
      }
      if (scope === 'venue_admins' || scope === 'both') {
        vaIdsToDelete = (await this.venueAdminRepo.find({ where: {} }))
          .filter((va) => va.workId !== TEST_VENUE_ADMIN_WORK_ID)
          .map((va) => va.id);
      }
      await this.deleteUsersAndVenueAdmins(userIdsToDelete, vaIdsToDelete);
      const part = scope === 'users' ? '学生/老师' : scope === 'venue_admins' ? '场地管理员' : '学生/老师与场地管理员';
      return { message: `已清空，仅保留测试账号（${part}）`, keptUser: !!keepUser, keptVenueAdmin: !!keepVa };
    }
    if (opts.clearAll) {
      let userIdsToDelete: number[] = [];
      let vaIdsToDelete: number[] = [];
      if (scope === 'users' || scope === 'both') {
        userIdsToDelete = (await this.userRepo.find({ select: ['id'] })).map((u) => u.id);
      }
      if (scope === 'venue_admins' || scope === 'both') {
        vaIdsToDelete = (await this.venueAdminRepo.find({ select: ['id'] })).map((va) => va.id);
      }
      await this.deleteUsersAndVenueAdmins(userIdsToDelete, vaIdsToDelete);
      const part = scope === 'users' ? '学生/老师' : scope === 'venue_admins' ? '场地管理员' : '学生/老师与场地管理员';
      return { message: `已完全清空${part}账号` };
    }
    if (opts.userIds?.length || opts.venueAdminIds?.length) {
      await this.deleteUsersAndVenueAdmins(opts.userIds ?? [], opts.venueAdminIds ?? []);
      return { message: '已删除所选账号' };
    }
    throw new BadRequestException('请指定 keepTestOnly、clearAll 或 userIds/venueAdminIds');
  }

  private async deleteUsersAndVenueAdmins(userIds: number[], venueAdminIds: number[]) {
    if (venueAdminIds.length) {
      await this.bookingRepo.update({ approvedBy: In(venueAdminIds) }, { approvedBy: null as any });
      if (venueAdminIds.length > 0) {
        await this.userRepo.manager.query(
          `DELETE FROM venue_admin_venue WHERE venue_admin_id IN (${venueAdminIds.map(() => '?').join(',')})`,
          venueAdminIds,
        );
      }
      await this.venueAdminRepo.delete(venueAdminIds);
    }
    if (userIds.length) {
      await this.bookingRepo.delete({ userId: In(userIds) });
      await this.userRepo.delete(userIds);
    }
  }

  async importAccountsFromBuffer(buffer: Buffer): Promise<{ usersCreated: number; venueAdminsCreated: number; errors: string[] }> {
    const xlsx = await import('xlsx');
    const book = xlsx.read(buffer, { type: 'buffer' });
    const errors: string[] = [];
    let usersCreated = 0;
    let venueAdminsCreated = 0;
    const defaultPassword = await bcrypt.hash('123456', 10);

    const userSheetName = book.SheetNames.find((n) => n === '学生' || n === '用户') || book.SheetNames[0];
    const userWs = book.Sheets[userSheetName];
    if (userWs) {
      const userData = xlsx.utils.sheet_to_json<Record<string, string>>(userWs, { header: 1, defval: '' }) as unknown as any[][];
      if (userData.length > 1) {
        const header = (userData[0] || []).map((h: any) => String(h).trim());
        const colStudentId = header.findIndex((h: string) => /学号/.test(String(h)));
        const colName = header.findIndex((h: string) => /姓名|名称/.test(String(h)));
        const colPassword = header.findIndex((h: string) => /初始密码|密码/.test(String(h)));
        if (colStudentId < 0) errors.push('学生表需包含“学号”列，请下载模板');
        else for (let i = 1; i < userData.length; i++) {
          const row = userData[i];
          const studentId = row && String(row[colStudentId] ?? '').trim();
          if (!studentId) continue;
          const name = (row && String(row[colName] ?? '').trim()) || null;
          const rawPwd = row && colPassword >= 0 ? String(row[colPassword] ?? '').trim() : '';
          const pwdHash = rawPwd.length >= 6 ? await bcrypt.hash(rawPwd, 10) : defaultPassword;
          try {
            await this.userRepo.insert({
              studentId,
              passwordHash: pwdHash,
              name: name || null,
              mustChangePassword: 1,
            });
            usersCreated++;
          } catch (e: any) {
            if (e?.code === 'ER_DUP_ENTRY') errors.push(`学生 ${studentId} 已存在，跳过`);
            else errors.push(`学生 ${studentId}: ${e?.message || '导入失败'}`);
          }
        }
      }
    }

    const vaSheetName = '场地管理员';
    const vaWs = book.Sheets[vaSheetName];
    if (vaWs) {
      const vaData = xlsx.utils.sheet_to_json<Record<string, string>>(vaWs, { header: 1, defval: '' }) as unknown as any[][];
      if (vaData.length > 1) {
        const header = (vaData[0] || []).map((h: any) => String(h).trim());
        const colWorkId = header.findIndex((h: string) => /工号/.test(String(h)));
        const colName = header.findIndex((h: string) => /姓名|名称/.test(String(h)));
        const colPassword = header.findIndex((h: string) => /初始密码|密码/.test(String(h)));
        for (let i = 1; i < vaData.length; i++) {
          const row = vaData[i];
          const workId = row && String(row[colWorkId] ?? '').trim();
          if (!workId) continue;
          const name = (row && String(row[colName] ?? '').trim()) || null;
          const rawPwd = row && colPassword >= 0 ? String(row[colPassword] ?? '').trim() : '';
          const pwdHash = rawPwd.length >= 6 ? await bcrypt.hash(rawPwd, 10) : defaultPassword;
          try {
            await this.venueAdminRepo.insert({
              workId,
              passwordHash: pwdHash,
              name: name || null,
            });
            venueAdminsCreated++;
          } catch (e: any) {
            if (e?.code === 'ER_DUP_ENTRY') errors.push(`场地管理员 ${workId} 已存在，跳过`);
            else errors.push(`场地管理员 ${workId}: ${e?.message || '导入失败'}`);
          }
        }
      }
    }

    return { usersCreated, venueAdminsCreated, errors };
  }

  getImportTemplateBuffer(): Buffer {
    const xlsx = require('xlsx');
    const wb = xlsx.utils.book_new();
    const userHeader = ['学号', '姓名', '初始密码'];
    const userExample = ['2024002', '张三', '123456'];
    const userWs = xlsx.utils.aoa_to_sheet([userHeader, userExample]);
    xlsx.utils.book_append_sheet(wb, userWs, '学生');
    const vaHeader = ['工号', '姓名', '初始密码'];
    const vaExample = ['va002', '李管理员', '123456'];
    const vaWs = xlsx.utils.aoa_to_sheet([vaHeader, vaExample]);
    xlsx.utils.book_append_sheet(wb, vaWs, '场地管理员');
    const out = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.isBuffer(out) ? out : Buffer.from(out);
  }
}
