import { apiClient } from './apiClient';

export const walletService = {
    getBalance: () => apiClient.get('/wallet/balance'),
    topup: (amount) => apiClient.post('/wallet/topup', { amount }),
    completePayment: (data) => apiClient.post('/wallet/topup/webhook', data),
    getTransactions: (page = 1, limit = 10) => apiClient.get('/wallet/transactions', { params: { page, limit } }),

    // Legacy support to prevent breaking other pages temporarily
    getWallet: () => apiClient.get('/wallet/balance'),
};
