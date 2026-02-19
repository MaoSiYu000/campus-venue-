import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Venue } from '../../venue/entities/venue.entity';
import { BookingApplication } from '../../booking/entities/booking-application.entity';

@Entity('venue_admin')
export class VenueAdmin {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'work_id', length: 32, unique: true })
  workId: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToMany(() => Venue, (v) => v.venueAdmins, { eager: false })
  @JoinTable({
    name: 'venue_admin_venue',
    joinColumn: { name: 'venue_admin_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'venue_id', referencedColumnName: 'id' },
  })
  venues: Venue[];

  @OneToMany(() => BookingApplication, (b) => b.approvedByAdmin)
  approvedApplications: BookingApplication[];
}
