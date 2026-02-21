import request from '@/utils/request';
import type { Notification } from '@/types';

export function getNotifications(unreadOnly?: boolean, limit?: number) {
  const params: { unread_only?: boolean; limit?: number } = {};
  if (unreadOnly) params.unread_only = true;
  if (limit != null && limit > 0) params.limit = limit;
  return request.get<Notification[]>('/notifications', { params });
}

export function markRead(id: number) {
  return request.post(`/notifications/mark-read/${id}`);
}

export function markAllRead() {
  return request.post('/notifications/mark-all-read');
}

export function deleteNotification(id: number) {
  return request.delete(`/notifications/${id}`);
}
