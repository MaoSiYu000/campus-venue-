import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('announcement')
export class Announcement {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_must_read', type: 'tinyint', default: 0 })
  isMustRead: number;

  @Column({ name: 'target_role', type: 'varchar', length: 32, nullable: true, default: null })
  targetRole: string | null; // 'user' | 'venue_admin' | 'all' | null（非必读公告为 null）

  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true })
  createdBy: number | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
