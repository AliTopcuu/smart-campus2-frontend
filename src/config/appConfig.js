// API Base URL
const getApiBaseUrl = () => {
    // Environment variable varsa onu kullan, yoksa localhost
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
};

export const appConfig = {
    apiBaseUrl: getApiBaseUrl(),
    appName: import.meta.env.VITE_APP_NAME ?? 'SmartCampus',
    tokenStorageKey: import.meta.env.VITE_TOKEN_STORAGE_KEY ?? 'smartcampus.auth',
};
export const apiRoutes = {
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        verifyEmail: '/auth/verify-email',
        forgotPassword: '/auth/forgot-password',
        resetPassword: '/auth/reset-password',
        refresh: '/auth/refresh',
        logout: '/auth/logout',
    },
    users: {
        me: '/users/me',
        profilePicture: '/users/me/profile-picture',
        changePassword: '/users/me/change-password',
    },
};
