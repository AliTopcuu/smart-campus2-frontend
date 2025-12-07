import { apiClient } from '@/services/apiClient';
import { apiRoutes } from '@/config/appConfig';
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from '@/types/auth';

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(apiRoutes.auth.login, payload);
    return data;
  },
  register: async (payload: RegisterPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(apiRoutes.auth.register, payload);
    return data;
  },
  verifyEmail: async (payload: VerifyEmailPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(apiRoutes.auth.verifyEmail, payload);
    return data;
  },
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(apiRoutes.auth.forgotPassword, payload);
    return data;
  },
  resetPassword: async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(apiRoutes.auth.resetPassword, payload);
    return data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post(apiRoutes.auth.logout);
  },
};

