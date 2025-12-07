import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { appConfig, apiRoutes } from '@/config/appConfig';
import { tokenStorage } from '@/utils/tokenStorage';

type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
};

const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  const { data } = await axios.post<RefreshResponse>(
    `${appConfig.apiBaseUrl}${apiRoutes.auth.refresh}`,
    {
      refreshToken,
    }
  );

  const updatedRefresh = data.refreshToken ?? refreshToken;
  tokenStorage.setTokens({ accessToken: data.accessToken, refreshToken: updatedRefresh });
  return data.accessToken;
};

const attachAuthorizationHeader = (config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

apiClient.interceptors.request.use(attachAuthorizationHeader);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (status === 401 && originalRequest && !originalRequest.headers?.['x-retry']) {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccessToken}`,
          'x-retry': 'true',
        };

        return apiClient(originalRequest);
      }

      tokenStorage.clear();
    }

    return Promise.reject(error);
  }
);

export { apiClient };

