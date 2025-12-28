import { apiClient } from './apiClient';

export const eventService = {
  list: async (params) => {
    const { data } = await apiClient.get('/events', { params });
    return data;
  },
  getById: async (eventId) => {
    const { data } = await apiClient.get(`/events/${eventId}`);
    return data;
  },
  register: async (eventId) => {
    const { data } = await apiClient.post('/events/register', { eventId });
    return data;
  },
  myRegistrations: async () => {
    const { data } = await apiClient.get('/events/my-registrations');
    return data;
  },
  checkIn: async (qrCodeData) => {
    const { data } = await apiClient.post('/events/check-in', { qrCodeData });
    return data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post('/events', payload);
    return data;
  },
  update: async (eventId, payload) => {
    const { data } = await apiClient.put(`/events/${eventId}`, payload);
    return data;
  },
  delete: async (eventId) => {
    const { data } = await apiClient.delete(`/events/${eventId}`);
    return data;
  },
  getParticipants: async (eventId) => {
    const { data } = await apiClient.get(`/events/${eventId}/participants`);
    return data;
  },
  getWaitlist: async (eventId) => {
    const { data } = await apiClient.get(`/events/${eventId}/waitlist`);
    return data;
  },
  removeParticipant: async (eventId, registrationId) => {
    const { data } = await apiClient.delete(`/events/${eventId}/participants/${registrationId}`);
    return data;
  },
};

