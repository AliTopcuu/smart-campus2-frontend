import { apiClient } from '@/services/apiClient';

export const excuseService = {
    // Öğrenci mazeret talebi oluşturur
    submit: async (payload) => {
        const formData = new FormData();
        formData.append('sessionId', payload.sessionId);
        formData.append('reason', payload.reason);
        if (payload.document) {
            formData.append('document', payload.document);
        }
        
        const { data } = await apiClient.post('/attendance/excuse-requests', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    
    // Öğrenci kendi mazeret taleplerini görür
    getMyRequests: async () => {
        const { data } = await apiClient.get('/attendance/excuse-requests/my-requests');
        return data;
    },
    
    // Öğretmen bekleyen mazeret taleplerini görür
    getPendingRequests: async () => {
        const { data } = await apiClient.get('/attendance/excuse-requests/pending');
        return data;
    },
    
    // Öğretmen mazeret talebini onaylar
    approve: async (requestId, notes) => {
        const { data } = await apiClient.put(`/attendance/excuse-requests/${requestId}/approve`, { notes });
        return data;
    },
    
    // Öğretmen mazeret talebini reddeder
    reject: async (requestId, notes) => {
        const { data } = await apiClient.put(`/attendance/excuse-requests/${requestId}/reject`, { notes });
        return data;
    },
    
    // Belirli bir tarih ve section için yoklama oturumlarını getir
    getSessions: async (sectionId, date) => {
        const { data } = await apiClient.get('/attendance/excuse-requests/sessions', {
            params: { sectionId, date }
        });
        return data;
    },
};
