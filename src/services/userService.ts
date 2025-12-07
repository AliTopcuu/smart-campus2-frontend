import { apiClient } from '@/services/apiClient';
import { apiRoutes } from '@/config/appConfig';
import type { AuthUser, ChangePasswordPayload, UpdateProfilePayload } from '@/types/auth';

export const userService = {
  getProfile: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<AuthUser>(apiRoutes.users.me);
    return data;
  },
  updateProfile: async (payload: UpdateProfilePayload): Promise<AuthUser> => {
    const { data } = await apiClient.put<AuthUser>(apiRoutes.users.me, payload);
    return data;
  },
  uploadProfilePicture: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post<{ avatarUrl: string }>(
      apiRoutes.users.profilePicture,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return data;
  },
  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(
      apiRoutes.users.changePassword,
      payload
    );
    return data;
  },
};

