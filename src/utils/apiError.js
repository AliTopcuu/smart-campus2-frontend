import axios from 'axios';
export const getApiErrorMessage = (error, fallback = 'Beklenmedik bir hata oluştu') => {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message ||
            error.response?.data?.error ||
            error.response?.data?.errors?.[0]?.message;
        return message ?? fallback;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
};
