import { apiClient } from '@/services/apiClient';
export const sectionService = {
    list: async (params) => {
        const { data } = await apiClient.get('/sections', { params });
        return data;
    },
    getById: async (sectionId) => {
        const { data } = await apiClient.get(`/sections/${sectionId}`);
        return data;
    },
    mySections: async () => {
        const { data } = await apiClient.get('/sections/my-sections');
        return data;
    },
    create: async (payload) => {
        const { data } = await apiClient.post('/sections', payload);
        return data;
    },
    update: async (sectionId, payload) => {
        const { data } = await apiClient.put(`/sections/${sectionId}`, payload);
        return data;
    },
};
