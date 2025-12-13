import { apiClient } from '@/services/apiClient';
import { apiRoutes } from '@/config/appConfig';
export const authService = {
    login: async (payload) => {
        const { data } = await apiClient.post(apiRoutes.auth.login, payload);
        return data;
    },
    register: async (payload) => {
        const { data } = await apiClient.post(apiRoutes.auth.register, payload);
        return data;
    },
    verifyEmail: async (payload) => {
        const { data } = await apiClient.post(apiRoutes.auth.verifyEmail, payload);
        return data;
    },
    forgotPassword: async (payload) => {
        const { data } = await apiClient.post(apiRoutes.auth.forgotPassword, payload);
        return data;
    },
    resetPassword: async (payload) => {
        const { data } = await apiClient.post(apiRoutes.auth.resetPassword, payload);
        return data;
    },
    logout: async () => {
        await apiClient.post(apiRoutes.auth.logout);
    },
};
