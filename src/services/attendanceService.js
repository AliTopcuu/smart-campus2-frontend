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
    getActiveSessions: async () => {
        const { data } = await apiClient.get('/attendance/sessions/active');
        return data;
    },
    getSessionById: async (sessionId) => {
        const { data } = await apiClient.get(`/attendance/sessions/${sessionId}`);
        return data;
    },
    checkIn: async (sessionId, payload) => {
        const { data } = await apiClient.post(`/attendance/sessions/${sessionId}/checkin`, payload);
        return data;
    },
    checkInByCode: async (code, payload) => {
        const { data } = await apiClient.post(`/attendance/sessions/code/${code}/checkin`, payload);
        return data;
    },
    myAttendance: async () => {
        const { data } = await apiClient.get('/attendance/my-attendance');
        return data;
    },
    myAttendanceByCourse: async () => {
        const { data } = await apiClient.get('/attendance/my-attendance-by-course');
        return data;
    },
    sessionReport: async (sessionId) => {
        const { data } = await apiClient.get(`/attendance/report/${sessionId}`);
        return data;
    },
};
