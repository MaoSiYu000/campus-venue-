import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'target_type', length: 32 })
  targetType: string;

  @Column({ name: 'target_id', type: 'bigint', unsigned: true })
  targetId: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_read', type: 'tinyint', default: 0 })
  isRead: number;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
