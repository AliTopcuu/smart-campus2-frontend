import { apiClient } from '@/services/apiClient';
import { apiRoutes } from '@/config/appConfig';
export const userService = {
    getProfile: async () => {
        const { data } = await apiClient.get(apiRoutes.users.me);
        return data;
    },
    updateProfile: async (payload) => {
        const { data } = await apiClient.put(apiRoutes.users.me, payload);
        return data;
    },
    uploadProfilePicture: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await apiClient.post(apiRoutes.users.profilePicture, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },
    changePassword: async (payload) => {
        const { data } = await apiClient.post(apiRoutes.users.changePassword, payload);
        return data;
    },
};
