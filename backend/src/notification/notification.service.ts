import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

export interface CreateNotificationDto {
  targetType: 'user' | 'venue_admin' | 'system_admin';
  targetId: number;
  title: string;
  content: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto) {
    const n = this.repo.create({
      targetType: dto.targetType,
      targetId: dto.targetId,
      title: dto.title,
      content: dto.content,
    });
    return this.repo.save(n);
  }

  async findByTarget(targetType: string, targetId: number, unreadOnly = false) {
    const qb = this.repo
      .createQueryBuilder('n')
      .where('n.target_type = :targetType', { targetType })
      .andWhere('n.target_id = :targetId', { targetId })
      .orderBy('n.created_at', 'DESC');
    if (unreadOnly) qb.andWhere('n.is_read = 0');
    return qb.getMany();
  }

  async markRead(id: number, targetType: string, targetId: number) {
    await this.repo.update(
      { id, targetType, targetId },
      { isRead: 1 },
    );
  }

  async markAllRead(targetType: string, targetId: number) {
    await this.repo.update({ targetType, targetId }, { isRead: 1 });
  }
}
