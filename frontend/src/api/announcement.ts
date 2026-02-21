import request from '@/utils/request';
import type { Announcement } from '@/types';

export function getMustRead() {
  return request.get<Announcement[]>('/announcements/must-read');
}

export function getMustReadHistory() {
  return request.get<Announcement[]>('/announcements/must-read/history');
}

export function markAnnouncementsRead(announcementIds: number[]) {
  return request.post('/announcements/mark-read', { announcementIds });
}

export function getAnnouncementList(): Promise<Announcement[]> {
  return request.get('/announcements') as Promise<Announcement[]>;
}

/** 系统管理员：我发布的公告（用于个人主页近期活动） */
export function getMyAnnouncements(): Promise<Announcement[]> {
  return request.get<Announcement[]>('/announcements/my');
}

export function createAnnouncement(data: { title: string; content: string; isMustRead: boolean; targetRole?: 'user' | 'venue_admin' | 'all' }) {
  return request.post<Announcement>('/announcements', data);
}

export function deleteAnnouncement(id: number) {
  return request.delete(`/announcements/${id}`);
}
