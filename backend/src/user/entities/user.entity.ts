import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BookingApplication } from '../../booking/entities/booking-application.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'student_id', length: 32, unique: true })
  studentId: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string | null;

  @Column({ name: 'must_change_password', type: 'tinyint', default: 1 })
  mustChangePassword: number;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => BookingApplication, (b) => b.user)
  bookingApplications: BookingApplication[];
}
