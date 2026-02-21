export type RoleType = 'user' | 'venue_admin' | 'system_admin';

export interface LoginUser {
  accessToken: string;
  role: RoleType;
  id: number;
  studentId?: string;
  workId?: string;
  username?: string;
  name?: string;
  phone?: string;
  college?: string;
  major?: string;
  class?: string;
  avatar?: string;
  mustChangePassword?: boolean;
}

export interface Venue {
  id: number;
  name: string;
  venueType: string;
  capacity: number;
  location: string | null;
  address: string | null;
  openTime: string | null;
  closeTime: string | null;
  hasProjector: number;
  hasSound: number;
  isAvailable: number;
  photos: string[] | null;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'used' | 'cancelled';

export interface BookingApplication {
  id: number;
  userId: number;
  venueId: number;
  useDate: string;
  startTime: string;
  endTime: string;
  activityName: string;
  organizer: string;
  estimatedPeople: number;
  contactName: string;
  contactPhone: string;
  description: string | null;
  proposalDocumentPath: string | null;
  status: BookingStatus;
  rejectReason: string | null;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
  venue?: Venue;
  user?: { id: number; studentId: string; name: string | null };
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  isMustRead: number;
  createdBy?: number | null;
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  isRead: number;
  createdAt: string;
}
