import { apiClient } from './apiClient';

export const classroomReservationService = {
  // Create reservation
  create: async (data) => {
    const response = await apiClient.post('/reservations', data);
    return response.data;
  },

  // List reservations
  list: async (params = {}) => {
    const response = await apiClient.get('/reservations', { params });
    return response.data;
  },

  // Approve reservation (Admin)
  approve: async (id) => {
    const response = await apiClient.put(`/reservations/${id}/approve`);
    return response.data;
  },

  // Reject reservation (Admin)
  reject: async (id, rejectionReason) => {
    const response = await apiClient.put(`/reservations/${id}/reject`, { rejectionReason });
    return response.data;
  },

  // Cancel reservation
  cancel: async (id) => {
    const response = await apiClient.delete(`/reservations/${id}`);
    return response.data;
  }
};

