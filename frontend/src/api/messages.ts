import axios from 'axios';
import type { Message } from '../types/conversation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with interceptors
const apiClient = axios.create({
    baseURL: API_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export interface PaginatedMessagesResponse {
    items: Message[];
    total: number;
    page: number;
    limit: number;
}

export const messagesApi = {
    /**
     * Get paginated message history for a conversation
     */
    async getMessageHistory(
        conversationId: string,
        page: number = 1,
        limit: number = 50
    ): Promise<PaginatedMessagesResponse> {
        const response = await apiClient.get<PaginatedMessagesResponse>(
            `/conversations/${conversationId}/messages`,
            {
                params: { page, limit },
            }
        );
        return response.data;
    },

    /**
     * Mark a conversation as read for the current user
     */
    async markConversationAsRead(conversationId: string): Promise<void> {
        await apiClient.post(`/conversations/${conversationId}/mark-read`);
    },

    /**
     * Get unread count for a conversation
     */
    async getUnreadCount(conversationId: string): Promise<number> {
        const response = await apiClient.get<{ conversationId: string; unreadCount: number }>(
            `/conversations/${conversationId}/unread-count`
        );
        return response.data.unreadCount;
    },

    /**
     * Get unread counts for all conversations of the current user
     */
    async getAllUnreadCounts(): Promise<{ conversationId: string; unreadCount: number }[]> {
        const response = await apiClient.get<
            { conversationId: string; unreadCount: number }[]
        >('/conversations/unread-counts');
        return response.data;
    },

    /**
     * Search messages in a conversation
     */
    async searchMessages(
        conversationId: string,
        params: {
            query: string;
            page?: number;
            limit?: number;
            startDate?: string;
            endDate?: string;
            senderId?: string;
        }
    ): Promise<PaginatedMessagesResponse> {
        const response = await apiClient.get<PaginatedMessagesResponse>(
            `/conversations/${conversationId}/messages/search`,
            { params }
        );
        return response.data;
    },
};
