import { apiClient } from './apiClient';

export const notificationService = {
  /**
   * Get user's notifications
   */
  getNotifications: async (options = {}) => {
    const { limit = 50, offset = 0, unreadOnly = false } = options;
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      unreadOnly: unreadOnly.toString(),
    });
    
    const response = await apiClient.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId) => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },
};

