import { apiClient } from '@/services/apiClient';
export const enrollmentService = {
    enroll: async (payload) => {
        const { data } = await apiClient.post('/enrollments', payload);
        return data;
    },
    drop: async (enrollmentId) => {
        const { data } = await apiClient.delete(`/enrollments/${enrollmentId}`);
        return data;
    },
    myCourses: async () => {
        const { data } = await apiClient.get('/enrollments/my-courses');
        return data;
    },
    sectionStudents: async (sectionId) => {
        const { data } = await apiClient.get(`/enrollments/students/${sectionId}`);
        return data;
    },
    getPendingEnrollments: async (sectionId) => {
        const { data } = await apiClient.get(`/enrollments/pending/${sectionId}`);
        return data;
    },
    approveEnrollment: async (enrollmentId) => {
        const { data } = await apiClient.patch(`/enrollments/${enrollmentId}/approve`);
        return data;
    },
    rejectEnrollment: async (enrollmentId) => {
        const { data } = await apiClient.patch(`/enrollments/${enrollmentId}/reject`);
        return data;
    },
};
