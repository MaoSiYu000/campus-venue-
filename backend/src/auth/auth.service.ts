import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../user/entities/user.entity';
import { VenueAdmin } from '../venue-admin/entities/venue-admin.entity';
import { SystemAdmin } from '../system-admin/entities/system-admin.entity';
import { ChangePasswordDto } from './dto/change-password.dto';

export type RoleType = 'user' | 'venue_admin' | 'system_admin';

export interface JwtPayload {
  sub: string;
  role: RoleType;
  id: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(VenueAdmin) private venueAdminRepo: Repository<VenueAdmin>,
    @InjectRepository(SystemAdmin) private systemAdminRepo: Repository<SystemAdmin>,
    private jwtService: JwtService,
  ) {}

  async login(role: RoleType, account: string, password: string) {
    if (role === 'user') {
      const user = await this.userRepo.findOne({ where: { studentId: account } });
      const hash = user?.passwordHash ?? (user as any)?.password_hash;
      if (!user || !hash) throw new UnauthorizedException('学号或密码错误');
      let ok = false;
      try {
        ok = await bcrypt.compare(password, hash);
      } catch {
        throw new UnauthorizedException('学号或密码错误');
      }
      if (!ok) throw new UnauthorizedException('学号或密码错误');
      const token = this.jwtService.sign({
        sub: user.studentId,
        role: 'user',
        id: user.id,
      } as JwtPayload);
      return {
        accessToken: token,
        role: 'user',
        id: user.id,
        studentId: user.studentId,
        name: user.name,
        phone: user.phone ?? null,
        college: user.college ?? null,
        major: user.major ?? null,
        class: user.class ?? null,
        avatar: user.avatar ?? null,
        mustChangePassword: !!user.mustChangePassword,
      };
    }
    if (role === 'venue_admin') {
      const admin = await this.venueAdminRepo.findOne({ where: { workId: account } });
      const hash = admin?.passwordHash ?? (admin as any)?.password_hash;
      if (!admin || !hash) throw new UnauthorizedException('工号或密码错误');
      let ok = false;
      try {
        ok = await bcrypt.compare(password, hash);
      } catch {
        throw new UnauthorizedException('工号或密码错误');
      }
      if (!ok) throw new UnauthorizedException('工号或密码错误');
      const token = this.jwtService.sign({
        sub: admin.workId,
        role: 'venue_admin',
        id: admin.id,
      } as JwtPayload);
      return {
        accessToken: token,
        role: 'venue_admin',
        id: admin.id,
        workId: admin.workId,
        name: admin.name,
        phone: admin.phone ?? null,
        avatar: admin.avatar ?? null,
      };
    }
    if (role === 'system_admin') {
      const admin = await this.systemAdminRepo.findOne({ where: { username: account } });
      const hash = admin?.passwordHash ?? (admin as any)?.password_hash;
      if (!admin || !hash) throw new UnauthorizedException('用户名或密码错误');
      let ok = false;
      try {
        ok = await bcrypt.compare(password, hash);
      } catch {
        throw new UnauthorizedException('用户名或密码错误');
      }
      if (!ok) throw new UnauthorizedException('用户名或密码错误');
      const token = this.jwtService.sign({
        sub: admin.username,
        role: 'system_admin',
        id: admin.id,
      } as JwtPayload);
      return {
        accessToken: token,
        role: 'system_admin',
        id: admin.id,
        username: admin.username,
        phone: admin.phone ?? null,
        avatar: admin.avatar ?? null,
      };
    }
    throw new UnauthorizedException('无效角色');
  }

  async changePasswordUser(userId: number, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    const hash = user.passwordHash ?? (user as any).password_hash;
    if (!(await bcrypt.compare(dto.oldPassword, hash))) throw new UnauthorizedException('原密码错误');
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    user.mustChangePassword = 0;
    await this.userRepo.save(user);
    return { message: '密码修改成功' };
  }

  async changePasswordVenueAdmin(adminId: number, dto: ChangePasswordDto) {
    const admin = await this.venueAdminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('账号不存在');
    const hash = admin.passwordHash ?? (admin as any).password_hash;
    if (!(await bcrypt.compare(dto.oldPassword, hash))) throw new UnauthorizedException('原密码错误');
    admin.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.venueAdminRepo.save(admin);
    return { message: '密码修改成功' };
  }

  async changePasswordSystemAdmin(adminId: number, dto: ChangePasswordDto) {
    const admin = await this.systemAdminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('账号不存在');
    const hash = admin.passwordHash ?? (admin as any).password_hash;
    if (!(await bcrypt.compare(dto.oldPassword, hash))) throw new UnauthorizedException('原密码错误');
    admin.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.systemAdminRepo.save(admin);
    return { message: '密码修改成功' };
  }

  async validateUser(payload: JwtPayload): Promise<{ id: number; role: RoleType } | null> {
    return { id: payload.id, role: payload.role };
  }

  async getProfile(role: RoleType, id: number) {
    if (role === 'user') {
      const user = await this.userRepo.findOne({ where: { id }, select: ['id', 'studentId', 'name', 'phone', 'college', 'major', 'class', 'avatar'] });
      if (!user) return null;
      return { role: 'user', id: user.id, studentId: user.studentId, name: user.name, phone: user.phone, college: user.college, major: user.major, class: user.class, avatar: user.avatar };
    }
    if (role === 'venue_admin') {
      const admin = await this.venueAdminRepo.findOne({ where: { id }, select: ['id', 'workId', 'name', 'phone', 'avatar'] });
      if (!admin) return null;
      return { role: 'venue_admin', id: admin.id, workId: admin.workId, name: admin.name, phone: admin.phone, avatar: admin.avatar };
    }
    if (role === 'system_admin') {
      const admin = await this.systemAdminRepo.findOne({ where: { id }, select: ['id', 'username', 'phone', 'avatar'] });
      if (!admin) return null;
      return { role: 'system_admin', id: admin.id, username: admin.username, phone: admin.phone, avatar: admin.avatar };
    }
    return null;
  }

  async updateProfile(role: RoleType, id: number, dto: { name?: string; phone?: string; college?: string; major?: string; class?: string; avatar?: string }) {
    if (role === 'user') {
      const user = await this.userRepo.findOne({ where: { id } });
      if (!user) throw new UnauthorizedException('用户不存在');
      if (dto.name !== undefined) user.name = dto.name || null;
      if (dto.phone !== undefined) user.phone = dto.phone || null;
      if (dto.college !== undefined) user.college = dto.college || null;
      if (dto.major !== undefined) user.major = dto.major || null;
      if (dto.class !== undefined) user.class = dto.class || null;
      if (dto.avatar !== undefined) user.avatar = dto.avatar || null;
      await this.userRepo.save(user);
      return this.getProfile('user', id);
    }
    if (role === 'venue_admin') {
      const admin = await this.venueAdminRepo.findOne({ where: { id } });
      if (!admin) throw new UnauthorizedException('账号不存在');
      if (dto.name !== undefined) admin.name = dto.name || null;
      if (dto.phone !== undefined) admin.phone = dto.phone || null;
      if (dto.avatar !== undefined) admin.avatar = dto.avatar || null;
      await this.venueAdminRepo.save(admin);
      return this.getProfile('venue_admin', id);
    }
    if (role === 'system_admin') {
      const admin = await this.systemAdminRepo.findOne({ where: { id } });
      if (!admin) throw new UnauthorizedException('账号不存在');
      if (dto.phone !== undefined) admin.phone = dto.phone || null;
      if (dto.avatar !== undefined) admin.avatar = dto.avatar || null;
      await this.systemAdminRepo.save(admin);
      return this.getProfile('system_admin', id);
    }
    throw new UnauthorizedException('无效角色');
  }
}
