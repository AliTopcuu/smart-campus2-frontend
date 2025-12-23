import { apiClient } from './apiClient';

export const mealService = {
    getMenus: (params) => apiClient.get('/meals/menus', { params }),
    getMenu: (id) => apiClient.get(`/meals/menus/${id}`),
    createMenu: (data) => apiClient.post('/meals/menus', data),
    updateMenu: (id, data) => apiClient.put(`/meals/menus/${id}`, data),
    deleteMenu: (id) => apiClient.delete(`/meals/menus/${id}`),
    getCafeterias: () => apiClient.get('/meals/cafeterias'),
    createCafeteria: (data) => apiClient.post('/meals/cafeterias', data),
    deleteCafeteria: (id) => apiClient.delete(`/meals/cafeterias/${id}`),
    // Reservations
    createReservation: (data) => apiClient.post('/meals/reservations', data),
    getMyReservations: () => apiClient.get('/meals/reservations/my'),
    scanReservation: (qrCode) => apiClient.post('/meals/reservations/scan', { qrCode }),
    cancelReservation: (reservationId) => apiClient.delete(`/meals/reservations/${reservationId}`),
};
