import { apiClient } from '@/services/apiClient';
export const gradeService = {
    myGrades: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.year !== undefined && filters.year !== null && filters.year !== '') {
            params.append('year', filters.year);
        }
        if (filters.semester !== undefined && filters.semester !== null && filters.semester !== '') {
            params.append('semester', filters.semester);
        }
        const queryString = params.toString();
        const url = `/grades/my-grades${queryString ? `?${queryString}` : ''}`;
        const { data } = await apiClient.get(url);
        return data;
    },
    transcript: async () => {
        const response = await apiClient.get('/grades/transcript', { responseType: 'json' });
        return response.data;
    },
    downloadTranscriptPdf: async () => {
        const response = await apiClient.get('/grades/transcript/pdf', { responseType: 'blob' });
        return response.data;
    },
    saveGrades: async (sectionId, payload) => {
        const { data } = await apiClient.post('/grades', { sectionId, ...payload });
        return data;
    },
};
