import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Venue } from '../../venue/entities/venue.entity';
import { VenueAdmin } from '../../venue-admin/entities/venue-admin.entity';

@Entity('booking_application')
export class BookingApplication {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @Column({ name: 'venue_id', type: 'bigint', unsigned: true })
  venueId: number;

  @Column({ name: 'use_date', type: 'date' })
  useDate: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'activity_name', length: 128 })
  activityName: string;

  @Column({ length: 128 })
  organizer: string;

  @Column({ name: 'estimated_people', type: 'int', unsigned: true, default: 0 })
  estimatedPeople: number;

  @Column({ name: 'contact_name', length: 64 })
  contactName: string;

  @Column({ name: 'contact_phone', length: 32 })
  contactPhone: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'proposal_document_path', type: 'varchar', length: 512, nullable: true })
  proposalDocumentPath: string | null;

  @Column({ length: 32, default: 'pending' })
  status: string;

  @Column({ name: 'reject_reason', type: 'varchar', length: 512, nullable: true })
  rejectReason: string | null;

  @Column({ name: 'approved_by', type: 'bigint', unsigned: true, nullable: true })
  approvedBy: number | null;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => User, (u) => u.bookingApplications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Venue, (v) => v.bookingApplications)
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;

  @ManyToOne(() => VenueAdmin, (va) => va.approvedApplications)
  @JoinColumn({ name: 'approved_by' })
  approvedByAdmin: VenueAdmin | null;
}
