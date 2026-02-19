import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VenueAdmin } from '../../venue-admin/entities/venue-admin.entity';
import { VenueUnavailableSlot } from './venue-unavailable-slot.entity';
import { BookingApplication } from '../../booking/entities/booking-application.entity';

@Entity('venue')
export class Venue {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ name: 'venue_type', length: 32 })
  venueType: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  capacity: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ name: 'open_time', type: 'time', nullable: true })
  openTime: string | null;

  @Column({ name: 'close_time', type: 'time', nullable: true })
  closeTime: string | null;

  @Column({ name: 'has_projector', type: 'tinyint', default: 0 })
  hasProjector: number;

  @Column({ name: 'has_sound', type: 'tinyint', default: 0 })
  hasSound: number;

  @Column({ name: 'is_available', type: 'tinyint', default: 1 })
  isAvailable: number;

  @Column({ type: 'json', nullable: true })
  photos: string[] | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToMany(() => VenueAdmin, (va) => va.venues)
  venueAdmins: VenueAdmin[];

  @OneToMany(() => VenueUnavailableSlot, (s) => s.venue)
  unavailableSlots: VenueUnavailableSlot[];

  @OneToMany(() => BookingApplication, (b) => b.venue)
  bookingApplications: BookingApplication[];
}
