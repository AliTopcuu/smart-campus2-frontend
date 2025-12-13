import { apiClient } from '@/services/apiClient';
export const departmentService = {
    list: async () => {
        const { data } = await apiClient.get('/departments');
        return data;
    },
    create: async (departmentData) => {
        const { data } = await apiClient.post('/departments', departmentData);
        return data;
    },
    update: async (id, departmentData) => {
        const { data } = await apiClient.put(`/departments/${id}`, departmentData);
        return data;
    },
    delete: async (id) => {
        const { data } = await apiClient.delete(`/departments/${id}`);
        return data;
    },
};
