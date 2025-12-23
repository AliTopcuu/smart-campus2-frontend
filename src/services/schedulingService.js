import { apiClient } from './apiClient';

export const schedulingService = {
  // Generate schedule (Admin)
  generate: async (data) => {
    const response = await apiClient.post('/scheduling/generate', data);
    return response.data;
  },

  // Apply schedule (Admin)
  apply: async (data) => {
    const response = await apiClient.post('/scheduling/apply', data);
    return response.data;
  },

  // Get my schedule
  getMySchedule: async (semester, year) => {
    const response = await apiClient.get('/scheduling/my-schedule', {
      params: { semester, year }
    });
    return response.data;
  },

  // Export iCal
  exportICal: async (semester, year) => {
    const response = await apiClient.get('/scheduling/my-schedule/ical', {
      params: { semester, year },
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `schedule-${semester}-${year}.ics`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

