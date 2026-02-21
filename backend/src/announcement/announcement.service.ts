import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entities/announcement.entity';
import { UserAnnouncementRead } from './entities/user-announcement-read.entity';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement) private repo: Repository<Announcement>,
    @InjectRepository(UserAnnouncementRead) private readRepo: Repository<UserAnnouncementRead>,
  ) {}

  async findMustRead(role: 'user' | 'venue_admin') {
    return this.repo.find({
      where: [
        { isMustRead: 1, targetRole: role },
        { isMustRead: 1, targetRole: 'all' },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findUnreadMustRead(userId: number, role: 'user' | 'venue_admin') {
    const mustRead = await this.findMustRead(role);
    const readIds = await this.readRepo
      .find({ where: { userId, role } })
      .then((r) => new Set(r.map((x) => x.announcementId)));
    return mustRead.filter((a) => !readIds.has(a.id));
  }

  async markRead(userId: number, role: 'user' | 'venue_admin', announcementId: number) {
    await this.readRepo.save({
      userId,
      role,
      announcementId,
    });
  }

  async markAllRead(userId: number, role: 'user' | 'venue_admin', announcementIds: number[]) {
    for (const aid of announcementIds) {
      await this.readRepo.save({ userId, role, announcementId: aid });
    }
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findByCreatedBy(systemAdminId: number) {
    return this.repo.find({
      where: { createdBy: systemAdminId },
      order: { createdAt: 'DESC' },
    });
  }

  async findReadMustRead(userId: number, role: 'user' | 'venue_admin') {
    const mustRead = await this.findMustRead(role);
    const readIds = await this.readRepo
      .find({ where: { userId, role } })
      .then((r) => new Set(r.map((x) => x.announcementId)));
    return mustRead.filter((a) => readIds.has(a.id));
  }

  async create(title: string, content: string, isMustRead: boolean, createdBy: number, targetRole?: 'user' | 'venue_admin' | 'all') {
    const a = this.repo.create({
      title,
      content,
      isMustRead: isMustRead ? 1 : 0,
      targetRole: isMustRead ? (targetRole || 'all') : null,
      createdBy,
    });
    return this.repo.save(a);
  }

  async delete(id: number) {
    await this.readRepo.delete({ announcementId: id });
    await this.repo.delete(id);
  }
}
