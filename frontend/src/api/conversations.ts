import axios from 'axios';
import type { Conversation, CreateConversationDto, AddParticipantDto } from '../types/conversation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
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
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const conversationsApi = {
    /**
     * Create a new conversation
     */
    createConversation: async (data: CreateConversationDto): Promise<Conversation> => {
        const response = await api.post<Conversation>('/conversations', data);
        return response.data;
    },

    /**
     * Get all conversations for the current user
     */
    getUserConversations: async (): Promise<Conversation[]> => {
        const response = await api.get<Conversation[]>('/conversations');
        return response.data;
    },

    /**
     * Get details of a specific conversation
     */
    getConversationDetails: async (conversationId: string): Promise<Conversation> => {
        const response = await api.get<Conversation>(`/conversations/${conversationId}`);
        return response.data;
    },

    /**
     * Add a participant to a conversation
     */
    addParticipant: async (
        conversationId: string,
        data: AddParticipantDto
    ): Promise<Conversation> => {
        const response = await api.post<Conversation>(
            `/conversations/${conversationId}/participants`,
            data
        );
        return response.data;
    },

    /**
     * Remove a participant from a conversation
     */
    removeParticipant: async (
        conversationId: string,
        userId: string
    ): Promise<Conversation> => {
        const response = await api.delete<Conversation>(
            `/conversations/${conversationId}/participants/${userId}`
        );
        return response.data;
    },
};
