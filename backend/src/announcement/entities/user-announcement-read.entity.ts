import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('user_announcement_read')
export class UserAnnouncementRead {
  @PrimaryColumn({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @PrimaryColumn({ name: 'role', length: 32 })
  role: string;

  @PrimaryColumn({ name: 'announcement_id', type: 'bigint', unsigned: true })
  announcementId: number;

  @Column({ name: 'read_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  readAt: Date;
}
