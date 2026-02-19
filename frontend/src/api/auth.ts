import request from '@/utils/request';
import type { LoginUser } from '@/types';

export function login(role: string, account: string, password: string) {
  return request.post<LoginUser>('/auth/login', { role, account, password });
}

export function getProfile() {
  return request.get<Record<string, unknown>>('/auth/profile');
}

export function updateProfile(data: { name?: string; phone?: string; avatar?: string }) {
  return request.patch<Record<string, unknown>>('/auth/profile', data);
}

export async function uploadAvatar(file: File): Promise<{ path: string | null }> {
  const form = new FormData();
  form.append('file', file);
  return request.post<{ path: string | null }>('/upload/avatar', form);
}

export function changePassword(oldPassword: string, newPassword: string) {
  return request.post('/auth/change-password', { oldPassword, newPassword });
}
