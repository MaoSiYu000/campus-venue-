import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Venue } from './venue.entity';

@Entity('venue_unavailable_slot')
export class VenueUnavailableSlot {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'venue_id', type: 'bigint', unsigned: true })
  venueId: number;

  @Column({ name: 'start_time', type: 'datetime' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime' })
  endTime: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => Venue, (v) => v.unavailableSlots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;
}
