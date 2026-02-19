import request from '@/utils/request';

export function getUsers() {
  return request.get('/system-admin/users');
}

export function getVenueAdmins() {
  return request.get('/system-admin/venue-admins');
}

export function notifyUser(targetId: number, title: string, content: string) {
  return request.post('/system-admin/notify-user', { targetId, title, content });
}

export function notifyVenueAdmin(targetId: number, title: string, content: string) {
  return request.post('/system-admin/notify-venue-admin', { targetId, title, content });
}

export function updateVenueAdminScope(venueAdminId: number, venueIds: number[]) {
  return request.post(`/system-admin/venue-admins/${venueAdminId}/scope`, { venueIds });
}

export interface ClearAccountsOptions {
  keepTestOnly?: boolean;
  clearAll?: boolean;
  clearScope?: 'users' | 'venue_admins' | 'both';
  userIds?: number[];
  venueAdminIds?: number[];
}

export function clearAccounts(opts: ClearAccountsOptions) {
  return request.post<{ message: string }>('/system-admin/accounts/clear', opts);
}

export function ensureTestAccounts(): Promise<{ userCreated: boolean; venueAdminCreated: boolean }> {
  return request.post('/system-admin/accounts/ensure-test') as Promise<{ userCreated: boolean; venueAdminCreated: boolean }>;
}

export function createUser(data: { studentId: string; name?: string; password?: string }) {
  return request.post('/system-admin/accounts/users', data);
}

export function createVenueAdmin(data: { workId: string; name?: string; password?: string }) {
  return request.post('/system-admin/accounts/venue-admins', data);
}

export async function downloadImportTemplate() {
  const data = await request.get<ArrayBuffer>('/system-admin/accounts/import-template', {
    responseType: 'arraybuffer',
  });
  const blob = new Blob([data as unknown as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '账号导入模板.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importAccounts(file: File) {
  const form = new FormData();
  form.append('file', file);
  const base = (request as any).defaults?.baseURL || '/api/v1';
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${base}/system-admin/accounts/import`, {
    method: 'POST',
    headers: { Authorization: token ? `Bearer ${token}` : '' },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || '导入失败');
  }
  return res.json();
}
