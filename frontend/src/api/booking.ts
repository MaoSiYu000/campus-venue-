import request from '@/utils/request';
import type { BookingApplication } from '@/types';

export interface CreateBookingDto {
  venueId: number;
  useDate: string;
  startTime: string;
  endTime: string;
  activityName: string;
  organizer: string;
  estimatedPeople: number;
  contactName: string;
  contactPhone: string;
  description?: string;
  proposalDocumentPath?: string;
}

export function checkAvailability(venueId: number, useDate: string, startTime: string, endTime: string) {
  return request.get<{ available: boolean; conflict?: boolean; hasUnavailableSlot?: boolean }>(
    '/booking-applications/check-availability',
    { params: { venue_id: venueId, use_date: useDate, start_time: startTime, end_time: endTime } }
  );
}

export function createBooking(data: CreateBookingDto) {
  return request.post<BookingApplication>('/booking-applications', data);
}

export function getMyBookings() {
  return request.get<BookingApplication[]>('/booking-applications/my');
}

export function getBookingDetail(id: number) {
  return request.get<BookingApplication>(`/booking-applications/${id}`);
}

export function cancelBooking(id: number) {
  return request.post(`/booking-applications/${id}/cancel`);
}

export function getPendingList() {
  return request.get<BookingApplication[]>('/booking-applications/pending');
}

export function getHistoryList() {
  return request.get<BookingApplication[]>('/booking-applications/history');
}

export function getOverview() {
  return request.get<BookingApplication[]>('/booking-applications/overview');
}

export function approveBooking(id: number) {
  return request.post<BookingApplication>(`/booking-applications/${id}/approve`);
}

export function rejectBooking(id: number, rejectReason: string) {
  return request.post<BookingApplication>(`/booking-applications/${id}/reject`, { rejectReason });
}

export function getAllBookings() {
  return request.get<BookingApplication[]>('/booking-applications/all');
}
