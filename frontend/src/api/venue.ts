import request from '@/utils/request';
import type { Venue } from '@/types';

export interface VenueFilters {
  venue_type?: string;
  min_capacity?: number;
  max_capacity?: number;
  location?: string;
  has_projector?: boolean;
  has_sound?: boolean;
  is_available?: boolean;
  exclude_booked_date?: string;
  exclude_booked_start?: string;
  exclude_booked_end?: string;
}

export function getVenueList(params?: VenueFilters) {
  return request.get<Venue[]>('/venues', { params });
}

export function getVenue(id: number) {
  return request.get<Venue>(`/venues/${id}`);
}

export function getManagedVenues() {
  return request.get<Venue[]>('/venues/managed/list');
}

export function createVenue(data: Partial<Venue> & { venueType: string; capacity: number }) {
  return request.post<Venue>('/venues', data);
}

export function updateVenue(id: number, data: Partial<Venue>) {
  return request.put<Venue>(`/venues/${id}`, data);
}

export function addUnavailableSlot(venueId: number, data: { startTime: string; endTime: string; reason?: string }) {
  return request.post(`/venues/${venueId}/unavailable-slots`, data);
}

export function getUnavailableSlots(venueId: number) {
  return request.get(`/venues/${venueId}/unavailable-slots`);
}

export function ensureTestVenues(): Promise<{ created: number }> {
  return request.post('/venues/ensure-test') as Promise<{ created: number }>;
}

export interface ClearVenuesOptions {
  keepTestOnly?: boolean;
  clearAll?: boolean;
  venueIds?: number[];
}

export function clearVenues(opts: ClearVenuesOptions) {
  return request.post<{ message: string; deleted?: number }>('/venues/clear', opts);
}

export async function downloadVenueTemplate() {
  const data = await request.get('/venues/import-template', { responseType: 'arraybuffer' }) as unknown as ArrayBuffer;
  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '场地导入模板.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importVenues(file: File): Promise<{ created: number; errors: string[] }> {
  const form = new FormData();
  form.append('file', file);
  const base = (request as any).defaults?.baseURL || '/api/v1';
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${base}/venues/import`, {
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
