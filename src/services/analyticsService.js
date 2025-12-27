import { apiClient } from './apiClient';

/**
 * Analytics API servisi
 * Admin dashboard, akademik performans, yoklama, yemek ve etkinlik analitiği
 */
const analyticsService = {
    /**
     * Dashboard istatistiklerini getir
     */
    getDashboardStats: async () => {
        const response = await apiClient.get('/analytics/dashboard');
        return response.data;
    },

    /**
     * Akademik performans verilerini getir
     */
    getAcademicPerformance: async () => {
        const response = await apiClient.get('/analytics/academic-performance');
        return response.data;
    },

    /**
     * Yoklama analitiğini getir
     */
    getAttendanceAnalytics: async () => {
        const response = await apiClient.get('/analytics/attendance');
        return response.data;
    },

    /**
     * Yemek kullanım raporlarını getir
     */
    getMealUsageAnalytics: async () => {
        const response = await apiClient.get('/analytics/meal-usage');
        return response.data;
    },

    /**
     * Etkinlik raporlarını getir
     */
    getEventAnalytics: async () => {
        const response = await apiClient.get('/analytics/events');
        return response.data;
    },

    /**
     * Rapor dışa aktarma
     * @param {string} type - academic, attendance, meal, event
     * @param {string} format - excel, csv, pdf
     */
    exportReport: async (type, format = 'excel') => {
        const response = await apiClient.get(`/analytics/export/${type}`, {
            params: { format },
            responseType: 'blob'
        });

        // Dosyayı indir
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const extension = format === 'excel' ? 'xlsx' : format;
        const typeNames = {
            academic: 'akademik_rapor',
            attendance: 'yoklama_raporu',
            meal: 'yemek_raporu',
            event: 'etkinlik_raporu'
        };

        link.download = `${typeNames[type] || 'rapor'}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
    }
};

export default analyticsService;
