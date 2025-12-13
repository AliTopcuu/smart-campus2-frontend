import { apiClient } from '@/services/apiClient';
export const excuseService = {
    submit: async (payload) => {
        const { data } = await apiClient.post('/attendance/excuse-requests', payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    list: async (params) => {
        const { data } = await apiClient.get('/attendance/excuse-requests', { params });
        return data;
    },
    approve: async (requestId, payload) => {
        const { data } = await apiClient.put(`/attendance/excuse-requests/${requestId}/approve`, payload);
        return data;
    },
    reject: async (requestId, payload) => {
        const { data } = await apiClient.put(`/attendance/excuse-requests/${requestId}/reject`, payload);
        return data;
    },
};
