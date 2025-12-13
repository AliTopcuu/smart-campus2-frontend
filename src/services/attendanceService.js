import { apiClient } from '@/services/apiClient';
export const attendanceService = {
    startSession: async (payload) => {
        const { data } = await apiClient.post('/attendance/sessions', payload);
        return data;
    },
    closeSession: async (sessionId) => {
        const { data } = await apiClient.put(`/attendance/sessions/${sessionId}/close`);
        return data;
    },
    mySessions: async () => {
        const { data } = await apiClient.get('/attendance/sessions/my-sessions');
        return data;
    },
    checkIn: async (sessionId, payload) => {
        const { data } = await apiClient.post(`/attendance/sessions/${sessionId}/checkin`, payload);
        return data;
    },
    myAttendance: async () => {
        const { data } = await apiClient.get('/attendance/my-attendance');
        return data;
    },
    sessionReport: async (sectionId, params) => {
        const { data } = await apiClient.get(`/attendance/report/${sectionId}`, { params });
        return data;
    },
};
