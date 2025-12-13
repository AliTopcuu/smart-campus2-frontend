import axios, { AxiosError } from 'axios';
import { appConfig, apiRoutes } from '@/config/appConfig';
import { tokenStorage } from '@/utils/tokenStorage';
const apiClient = axios.create({
    baseURL: appConfig.apiBaseUrl,
    withCredentials: true,
});
let refreshPromise = null;
const refreshAccessToken = async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken)
        return null;
    const { data } = await axios.post(`${appConfig.apiBaseUrl}${apiRoutes.auth.refresh}`, {
        refreshToken,
    });
    const updatedRefresh = data.refreshToken ?? refreshToken;
    tokenStorage.setTokens({ accessToken: data.accessToken, refreshToken: updatedRefresh });
    return data.accessToken;
};
const attachAuthorizationHeader = (config) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (!token) {
        console.warn('API request made without access token:', config.url);
    }
    return config;
};
apiClient.interceptors.request.use(attachAuthorizationHeader);
apiClient.interceptors.response.use((response) => response, async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - token expired or invalid
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
    
    // Handle 403 Forbidden - insufficient permissions
    if (status === 403) {
        const user = tokenStorage.getUser();
        console.error('403 Forbidden - Insufficient permissions', {
            url: originalRequest?.url,
            method: originalRequest?.method,
            userRole: user?.role,
            userId: user?.id,
            errorMessage: error.response?.data?.message,
        });
    }
    
    // Handle network errors
    if (!error.response && error.request) {
        console.error('Network Error - Backend may be down or unreachable', {
            url: originalRequest?.url,
            method: originalRequest?.method,
            baseURL: apiClient.defaults.baseURL,
            message: error.message,
        });
    }
    
    return Promise.reject(error);
});
export { apiClient };
