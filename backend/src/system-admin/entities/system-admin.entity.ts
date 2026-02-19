import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('system_admin')
export class SystemAdmin {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 64, unique: true })
  username: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
