import request from '@/utils/request';
import type { Notification } from '@/types';

export function getNotifications(unreadOnly?: boolean) {
  return request.get<Notification[]>('/notifications', { params: { unread_only: unreadOnly } });
}

export function markRead(id: number) {
  return request.post(`/notifications/mark-read/${id}`);
}

export function markAllRead() {
  return request.post('/notifications/mark-all-read');
}
