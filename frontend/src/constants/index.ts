export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

export const TOKEN_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
} as const;

export const TOKEN_EXPIRY = {
    ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes in milliseconds
    REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
} as const;
