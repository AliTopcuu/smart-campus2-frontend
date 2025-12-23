import { apiClient } from '@/services/apiClient';
export const courseService = {
    list: async (params) => {
        const { data } = await apiClient.get('/courses', { params });
        return data;
    },
    getById: async (courseId) => {
        const { data } = await apiClient.get(`/courses/${courseId}`);
        return data;
    },
    create: async (payload) => {
        const { data } = await apiClient.post('/courses', payload);
        return data;
    },
    update: async (courseId, payload) => {
        const { data } = await apiClient.put(`/courses/${courseId}`, payload);
        return data;
    },
    delete: async (courseId) => {
        const { data } = await apiClient.delete(`/courses/${courseId}`);
        return data;
    },
    getClassrooms: async () => {
        const { data } = await apiClient.get('/courses/classrooms');
        return data;
    },
};
